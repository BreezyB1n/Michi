import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App";

const sampleIntent = "I want to build a small service that other people can access.";

const startBackendGuide = async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /text guide/i }));
  await user.clear(screen.getByLabelText(/user intent/i));
  await user.type(screen.getByLabelText(/user intent/i), sampleIntent);
  await user.click(screen.getByRole("button", { name: /start guide/i }));
  await user.click(screen.getByRole("button", { name: /backend logic or api/i }));

  return user;
};

describe("Michi app", () => {
  it("renders intent entry and starts the clarification flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /text guide/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/michi plugin panel/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /text guide/i }));

    expect(screen.getByRole("heading", { name: /michi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/user intent/i)).toHaveValue(sampleIntent);
    expect(screen.getByRole("button", { name: /text guide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run check/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /minimize panel/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /image mode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /video mode/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start guide/i }));

    expect(screen.getByText(/what kind of service are you building/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /backend logic or api/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /static website/i })).toBeInTheDocument();
  });

  it("collapses and expands the guide panel without resetting session state", async () => {
    const user = await startBackendGuide();

    expect(screen.getByRole("heading", { name: /Find the Workers entry/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /minimize panel/i }));
    expect(screen.queryByLabelText(/michi plugin panel/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /text guide/i }));
    expect(screen.getByRole("heading", { name: /Find the Workers entry/i })).toBeInTheDocument();
  });

  it("shows the Guide Workspace with capability, step purpose, completion check, and page state", async () => {
    await startBackendGuide();

    expect(screen.getByLabelText(/simulated host website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/michi plugin panel/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloudflare Workers/i)).toBeInTheDocument();
    expect(screen.getByText(/Compute/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Find the Workers entry/i })).toBeInTheDocument();
    expect(screen.getByText(/Step purpose/i)).toBeInTheDocument();
    expect(screen.getByText(/Completion check/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloudflare dashboard \/ Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Workers & Pages sidebar item/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider synced/i)).toBeInTheDocument();
  });

  it("requires explicit confirmation for a critical write action", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Confirm Create Worker/i })).toBeInTheDocument();
    expect(screen.getByText(/Creates a new Cloudflare Worker resource/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirm action/i }));

    expect(screen.getByRole("heading", { name: /Review the starter response/i })).toBeInTheDocument();
  });

  it("explains and recovers from simulated page drift", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /simulate page drift/i }));

    expect(screen.getByRole("heading", { name: /Page layout changed/i })).toBeInTheDocument();
    expect(screen.getByText(/Recovery step/i)).toBeInTheDocument();
    expect(screen.getByText(/current step cannot be anchored/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard search for Workers & Pages/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /recover and re-check/i }));

    expect(screen.getByRole("heading", { name: /Find the Workers entry/i })).toBeInTheDocument();
    expect(screen.getByText(/Provider synced/i)).toBeInTheDocument();
  });

  it("reaches completion with DNS as the follow-up route", async () => {
    const user = await startBackendGuide();

    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));
    await user.click(screen.getByRole("button", { name: /confirm action/i }));
    await user.click(screen.getByRole("button", { name: /advance guide/i }));

    expect(screen.getByRole("heading", { name: /Worker URL verified/i })).toBeInTheDocument();
    expect(screen.getByText(/Worker URL returned HTTP 200/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloudflare DNS/i)).toBeInTheDocument();
    expect(screen.getByText(/Domain routing/i)).toBeInTheDocument();
  });
});
