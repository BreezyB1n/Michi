import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

type ExtensionManifest = {
  manifest_version: number;
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  optional_host_permissions?: string[];
  content_scripts?: Array<{
    matches?: string[];
    js?: string[];
    run_at?: string;
  }>;
  [key: string]: unknown;
};

type BlockedApiReference = {
  api: string;
  file: string;
  line: number;
  snippet: string;
};

type DynamicImportIssue = {
  file: string;
  line: number;
  snippet: string;
  reason: string;
};

type ExtensionPermissionReport = {
  manifest: ExtensionManifest;
  scannedFiles: string[];
  blockedApiReferences: BlockedApiReference[];
  dynamicImportIssues: DynamicImportIssue[];
};

type ExtensionPermissionReportOptions = {
  rootDir?: string;
  manifestPath?: string;
  entryFiles?: string[];
};

const defaultManifestPath = "extension/public/manifest.json";
const defaultEntryFiles = [
  "src/extension/contentScript.ts",
  "src/extension/serviceWorker.ts"
];
const extensionSourceExtensions = [".ts", ".tsx", ".js", ".jsx"];

const lineForNode = (sourceFile: ts.SourceFile, node: ts.Node) =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

const dynamicImportIssue = (
  sourceFile: ts.SourceFile,
  node: ts.Node,
  file: string
): DynamicImportIssue => ({
  file: path.relative(process.cwd(), file),
  line: lineForNode(sourceFile, node),
  snippet: node.getText(sourceFile).replace(/\s+/g, " "),
  reason: "dynamic import must use a literal relative specifier"
});

const relativeImportSpecifiers = (file: string, sourceFile: ts.SourceFile) => {
  const specifiers: string[] = [];
  const dynamicImportIssues: DynamicImportIssue[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith(".")
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith(".")
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [specifier] = node.arguments;

      if (node.arguments.length === 1 && ts.isStringLiteral(specifier) && specifier.text.startsWith(".")) {
        specifiers.push(specifier.text);
      } else {
        dynamicImportIssues.push(dynamicImportIssue(sourceFile, node, file));
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return { specifiers, dynamicImportIssues };
};

const resolveRelativeSourceFile = (fromFile: string, specifier: string) => {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    basePath,
    ...extensionSourceExtensions.map((extension) => `${basePath}${extension}`),
    ...extensionSourceExtensions.map((extension) => path.join(basePath, `index${extension}`))
  ];

  return candidates.find((candidate) => existsSync(candidate));
};

const extensionSourceGraphFiles = (rootDir: string, entryFiles: string[]) => {
  const visited = new Set<string>();
  const files: string[] = [];
  const dynamicImportIssues: DynamicImportIssue[] = [];

  const visitFile = (file: string) => {
    const absoluteFile = path.resolve(rootDir, file);

    if (visited.has(absoluteFile)) {
      return;
    }

    visited.add(absoluteFile);
    files.push(absoluteFile);

    const sourceText = readFileSync(absoluteFile, "utf8");
    const sourceFile = ts.createSourceFile(absoluteFile, sourceText, ts.ScriptTarget.Latest, true);
    const importAnalysis = relativeImportSpecifiers(absoluteFile, sourceFile);
    dynamicImportIssues.push(...importAnalysis.dynamicImportIssues);

    for (const specifier of importAnalysis.specifiers) {
      const resolved = resolveRelativeSourceFile(absoluteFile, specifier);

      if (resolved) {
        visitFile(resolved);
      }
    }
  };

  entryFiles.forEach(visitFile);
  return { files, dynamicImportIssues };
};

const blockedReference = (
  sourceFile: ts.SourceFile,
  node: ts.Node,
  file: string,
  api: string
): BlockedApiReference => ({
  api,
  file: path.relative(process.cwd(), file),
  line: lineForNode(sourceFile, node),
  snippet: node.getText(sourceFile).replace(/\s+/g, " ")
});

const stringLiteralText = (node: ts.Node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : undefined;

const isChromeObject = (node: ts.Expression) => node.getText() === "chrome";
const isFetchOwner = (node: ts.Expression) =>
  ["window", "globalThis", "self"].includes(node.getText());

const isIdentifierReference = (node: ts.Identifier) => {
  const parent = node.parent;

  return !(
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isShorthandPropertyAssignment(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && parent.name === node) ||
    (ts.isImportSpecifier(parent) && parent.name === node) ||
    (ts.isImportClause(parent) && parent.name === node) ||
    (ts.isNewExpression(parent) && parent.expression === node)
  );
};

const blockedChromeApi = (name: string) =>
  name === "storage" || name === "scripting" ? `chrome.${name}` : undefined;

const blockedFetchProperty = (owner: ts.Expression, name: string) =>
  isFetchOwner(owner) && name === "fetch" ? "fetch" : undefined;

const blockedPropertyAccessApi = (node: ts.PropertyAccessExpression) => {
  const name = node.name.text;

  return (
    (isChromeObject(node.expression) ? blockedChromeApi(name) : undefined) ??
    blockedFetchProperty(node.expression, name) ??
    (node.expression.getText() === "navigator" && name === "sendBeacon"
      ? "navigator.sendBeacon"
      : undefined)
  );
};

const blockedElementAccessApi = (node: ts.ElementAccessExpression) => {
  const name = stringLiteralText(node.argumentExpression);

  if (!name) {
    return undefined;
  }

  return (
    (isChromeObject(node.expression) ? blockedChromeApi(name) : undefined) ??
    blockedFetchProperty(node.expression, name)
  );
};

const blockedObjectBindingReferences = (
  node: ts.VariableDeclaration,
  sourceFile: ts.SourceFile,
  file: string
) => {
  if (!ts.isObjectBindingPattern(node.name) || !node.initializer) {
    return [];
  }

  const initializerText = node.initializer.getText(sourceFile);
  const references: BlockedApiReference[] = [];

  for (const element of node.name.elements) {
    const propertyName = element.propertyName ?? element.name;
    const name = propertyName.getText(sourceFile);
    const api =
      initializerText === "chrome"
        ? blockedChromeApi(name)
        : ["window", "globalThis", "self"].includes(initializerText) && name === "fetch"
          ? "fetch"
          : initializerText === "navigator" && name === "sendBeacon"
            ? "navigator.sendBeacon"
            : undefined;

    if (api) {
      references.push(blockedReference(sourceFile, element, file, api));
    }
  }

  return references;
};

const blockedApiReferencesInFile = (file: string): BlockedApiReference[] => {
  const sourceText = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const references: BlockedApiReference[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node)) {
      const api = blockedPropertyAccessApi(node);

      if (api) {
        references.push(blockedReference(sourceFile, node, file, api));
      }
    }

    if (ts.isElementAccessExpression(node)) {
      const api = blockedElementAccessApi(node);

      if (api) {
        references.push(blockedReference(sourceFile, node, file, api));
      }
    }

    if (ts.isIdentifier(node) && (node.text === "fetch" || node.text === "XMLHttpRequest") && isIdentifierReference(node)) {
      references.push(blockedReference(sourceFile, node, file, node.text));
    }

    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "XMLHttpRequest"
    ) {
      references.push(blockedReference(sourceFile, node, file, "XMLHttpRequest"));
    }

    if (ts.isVariableDeclaration(node)) {
      references.push(...blockedObjectBindingReferences(node, sourceFile, file));
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return references;
};

export const createExtensionPermissionReport = (
  options: ExtensionPermissionReportOptions = {}
): ExtensionPermissionReport => {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const entryFiles = options.entryFiles ?? defaultEntryFiles;
  const absoluteManifestPath = path.resolve(rootDir, options.manifestPath ?? defaultManifestPath);
  const manifest = JSON.parse(readFileSync(absoluteManifestPath, "utf8")) as ExtensionManifest;
  const sourceGraph = extensionSourceGraphFiles(rootDir, entryFiles);

  return {
    manifest,
    scannedFiles: sourceGraph.files.map((file) => path.relative(rootDir, file)),
    blockedApiReferences: sourceGraph.files.flatMap(blockedApiReferencesInFile),
    dynamicImportIssues: sourceGraph.dynamicImportIssues.map((issue) => ({
      ...issue,
      file: path.relative(rootDir, path.resolve(process.cwd(), issue.file))
    }))
  };
};
