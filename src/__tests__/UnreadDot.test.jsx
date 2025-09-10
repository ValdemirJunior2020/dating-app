import React from "react";
import { render, screen } from "@testing-library/react";
import UnreadDot from "../components/UnreadDot";

describe("<UnreadDot />", () => {
  test("renders when show=true", () => {
    render(<div style={{ position: "relative" }}><UnreadDot show /></div>);
    expect(screen.getByTestId("unread-dot")).toBeInTheDocument();
  });

  test("does not render when show=false", () => {
    const { queryByTestId } = render(<UnreadDot show={false} />);
    expect(queryByTestId("unread-dot")).toBeNull();
  });
});
