/**
 * QRScanner.test.tsx
 *
 * Unit tests for the QRScanner component (Issue #50).
 * These tests cover:
 *  1. Loading state shown on mount
 *  2. HTTPS / isSecureContext guard
 *  3. Browser support guard (no getUserMedia)
 *  4. Camera permission denied (NotAllowedError)
 *  5. No camera found (NotFoundError)
 *  6. Invalid QR code (random string / URL)
 *  7. Valid package ID (UUID) triggers onScanSuccess
 *  8. Valid package ID (CUID) triggers onScanSuccess
 *  9. Retry button re-triggers scanner initialisation
 * 10. Scanner stop() called on unmount (no memory leak)
 */

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock next-intl so we can test without a real IntlProvider
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

// We'll control what html5-qrcode returns per test
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockIsScanning = { value: false };

// Build a controllable Html5Qrcode mock
class MockHtml5Qrcode {
  get isScanning() {
    return mockIsScanning.value;
  }
  start(...args: any[]) {
    return mockStart(...args);
  }
  stop(...args: any[]) {
    return mockStop(...args);
  }
}

jest.mock("html5-qrcode", () => ({
  Html5Qrcode: MockHtml5Qrcode,
  Html5QrcodeSupportedFormats: { QR_CODE: 0 },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Configure the mock so start() succeeds and calls the success callback with
 * `decodedText` synchronously (simulating a QR detection event).
 */
function mockScannerSuccess(decodedText: string) {
  mockStart.mockImplementation(
    (
      _constraint: any,
      _config: any,
      onSuccess: (text: string) => void,
      _onError: () => void
    ) => {
      mockIsScanning.value = true;
      onSuccess(decodedText); // simulate immediate scan
      return Promise.resolve();
    }
  );
}

/**
 * Configure the mock so start() fails with the given error message
 * on all constraint attempts.
 */
function mockScannerError(errorMessage: string) {
  mockStart.mockRejectedValue(new Error(errorMessage));
}

// ── Component import ──────────────────────────────────────────────────────────

// Import *after* mocks are set up (use @/ alias so moduleNameMapper resolves to src/)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRScanner = require("@/components/QRScanner").default as React.ComponentType<{
  onScanSuccess: (text: string) => void;
  onScanError?: (msg: string) => void;
  onClose: () => void;
}>;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("QRScanner", () => {
  const defaultProps = {
    onScanSuccess: jest.fn(),
    onScanError: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsScanning.value = false;

    // Default: HTTPS context + getUserMedia supported
    Object.defineProperty(window, "isSecureContext", {
      writable: true,
      value: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: { getUserMedia: jest.fn() },
    });

    // Default: start resolves (no scan yet)
    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
  });

  // ── 1. Loading state ────────────────────────────────────────────────────────
  test("shows loading state immediately on mount", () => {
    // start() never resolves in this test — keeps loading state
    mockStart.mockReturnValue(new Promise(() => {}));

    render(<QRScanner {...defaultProps} />);

    expect(screen.getByText("Scanner.searching")).toBeInTheDocument();
  });

  // ── 2. HTTPS guard ──────────────────────────────────────────────────────────
  test("shows HTTPS error when isSecureContext is false", async () => {
    Object.defineProperty(window, "isSecureContext", {
      writable: true,
      value: false,
    });

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorHttps")).toBeInTheDocument();
    });
    expect(screen.getByText("Scanner.errorHeader")).toBeInTheDocument();
    expect(defaultProps.onScanSuccess).not.toHaveBeenCalled();
  });

  // ── 3. Browser support guard ────────────────────────────────────────────────
  test("shows browser error when getUserMedia is not supported", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: undefined,
    });

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorBrowser")).toBeInTheDocument();
    });
    expect(defaultProps.onScanSuccess).not.toHaveBeenCalled();
  });

  // ── 4. Permission denied ────────────────────────────────────────────────────
  test("shows permission error when camera access is denied (NotAllowedError)", async () => {
    mockScannerError("NotAllowedError: Permission denied");

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorPermission")).toBeInTheDocument();
    });
    expect(defaultProps.onScanError).toHaveBeenCalledWith(
      expect.stringContaining("NotAllowedError")
    );
  });

  // ── 5. No camera found ──────────────────────────────────────────────────────
  test("shows no-camera error when NotFoundError is thrown", async () => {
    mockScannerError("NotFoundError: Requested device not found");

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorNotFound")).toBeInTheDocument();
    });
  });

  // ── 6. Invalid QR code (random string) ─────────────────────────────────────
  test("shows invalid QR error when scanned text is not a valid package ID", async () => {
    mockScannerSuccess("https://google.com"); // not a UUID/CUID

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorInvalidQR")).toBeInTheDocument();
    });
    expect(defaultProps.onScanSuccess).not.toHaveBeenCalled();
    expect(defaultProps.onScanError).toHaveBeenCalledWith(
      expect.stringContaining("invalid_qr:")
    );
  });

  test("shows invalid QR error when scanned text is a plain short string", async () => {
    mockScannerSuccess("hello-world-123");

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorInvalidQR")).toBeInTheDocument();
    });
  });

  // ── 7. Valid UUID triggers onScanSuccess ────────────────────────────────────
  test("calls onScanSuccess with a valid UUID package ID", async () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";
    mockScannerSuccess(validUUID);

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onScanSuccess).toHaveBeenCalledWith(validUUID);
    });
    expect(defaultProps.onScanError).not.toHaveBeenCalled();
  });

  // ── 8. Valid CUID triggers onScanSuccess ────────────────────────────────────
  test("calls onScanSuccess with a valid CUID package ID", async () => {
    const validCUID = "clxxxxxxxxxxxxxxxxxxxxxx"; // 24-char CUID-like
    mockScannerSuccess(validCUID);

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onScanSuccess).toHaveBeenCalledWith(validCUID);
    });
  });

  // ── 9. Retry button ─────────────────────────────────────────────────────────
  test("retry button re-initialises the scanner after an error", async () => {
    // First attempt: permission denied
    mockScannerError("NotAllowedError: Permission denied");

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scanner.errorPermission")).toBeInTheDocument();
    });

    // Now allow success on retry
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";
    mockScannerSuccess(validUUID);

    const retryButton = screen.getByText("Scanner.retry");
    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(defaultProps.onScanSuccess).toHaveBeenCalledWith(validUUID);
    });
  });

  // ── 10. Unmount cleans up the scanner ───────────────────────────────────────
  test("stops the scanner when the component unmounts", async () => {
    // Keep scanning indefinitely so we can unmount mid-scan
    mockStart.mockImplementation(() => {
      mockIsScanning.value = true;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = render(<QRScanner {...defaultProps} />);

    // Wait for start() to be called
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    unmount();

    // stop() should have been called exactly once
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledTimes(1);
    });
  });

  // ── Close button ─────────────────────────────────────────────────────────────
  test("calls onClose when the close button is clicked", () => {
    mockStart.mockReturnValue(new Promise(() => {}));

    render(<QRScanner {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close scanner");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
