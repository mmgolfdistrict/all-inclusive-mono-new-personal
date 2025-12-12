import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ManageProfile from "../page";
import { useSession } from "@golf-district/auth/nextjs-exports";
import { useUser } from "~/hooks/useUser";
import { useAppContext } from "~/contexts/AppContext";
import type { ComponentType, ImgHTMLAttributes } from "react";

// ------------------ API MOCK ------------------ //

vi.mock("~/utils/api", () => ({
    api: {
        cashOut: {
            createStripeAccountLink: { useMutation: () => ({ mutate: vi.fn() }) },
            createCashoutTransfer: { useMutation: () => ({ mutate: vi.fn() }) },
            getAssociatedAccounts: { useQuery: () => ({ data: [], isLoading: false }) },
            getRecievables: { useQuery: () => ({ data: [], isLoading: false }) },
        },
        user: { updateUser: { useMutation: () => ({ mutate: vi.fn() }) } },
        upload: {
            getPresignedUrl: { useMutation: () => ({ mutate: vi.fn() }) },
            completeUpload: { useMutation: () => ({ mutate: vi.fn() }) },
            deleteFile: { useMutation: () => ({ mutate: vi.fn() }) },
        },
        profanity: { checkProfanity: { useMutation: () => ({ mutate: vi.fn(), data: null, reset: vi.fn() }) } },
        places: {
            getCity: {
                useQuery: () => ({
                    data: {
                        autocompleteCities: {
                            features: [
                                { place_name: "New York" },
                                { place_name: "Los Angeles" },
                                { place_name: "Chicago" }
                            ]
                        }
                    },
                    isLoading: false,
                }),
            },
        },
        checkout: {
            retrievePaymentMethods: {
                useQuery: () => ({
                    data: [],
                    isLoading: false,
                    refetch: vi.fn(),
                }),
            },
            createPaymentMethod: { useMutation: () => ({ mutate: vi.fn() }) },
            removePaymentMethod: { useMutation: () => ({ mutate: vi.fn() }) },
        },
    },
}));

vi.mock("~/hooks/useMe", () => ({
    useMe: () => ({ user: { id: "1", name: "John Doe" } })
}));

// ------------------ NEXT/IMAGE MOCK ------------------ //

vi.mock("next/image", () => {
    /* eslint-disable @next/next/no-img-element */
    const MockImage: ComponentType<ImgHTMLAttributes<HTMLImageElement>> = (props) => (
        <img {...props} alt="mock-component" />
    );
    /* eslint-enable @next/next/no-img-element */

    return {
        __esModule: true,
        default: MockImage,
    };
});

// ------------------ Mocks ------------------ //

vi.mock("@golf-district/auth/nextjs-exports");
vi.mock("~/hooks/useUser");
vi.mock("~/contexts/AppContext");

const mockUseSession = useSession as unknown as Mock;
const mockUseUser = useUser as unknown as Mock;
const mockUseAppContext = useAppContext as unknown as Mock;

const pushMock = vi.fn();

vi.mock("next/navigation", async (importOriginal: () => Promise<unknown>) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        useRouter: vi.fn(() => ({ push: pushMock })),
        useParams: vi.fn(() => ({ userId: "user-1", course: "course-1" })),
    };
});

// AppContext mock
mockUseAppContext.mockReturnValue({
    setActivePage: vi.fn(),
});

// matchMedia mock
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }),
});

// ------------------ TESTS ------------------ //

describe("ManageProfile Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders child components when authenticated", () => {
        mockUseSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user-1" } },
        });

        mockUseUser.mockReturnValue({
            isLoading: false,
            data: {
                id: "user-1",
                allowDeleteCreditCard: true,
                bannerPicture: "/images/banner.png",
                bannerImage: "banner-id",
            },
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);

        expect(screen.getByText(/Back to tee times/i)).toBeInTheDocument();
        expect(screen.getByText(/Saved Credit Cards/i)).toBeInTheDocument();
    });

    it("redirects if unauthenticated", async () => {
        mockUseSession.mockReturnValue({
            status: "unauthenticated",
            data: null,
        });

        mockUseUser.mockReturnValue({
            isLoading: false,
            data: null,
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/course-1"));
    });

    it("redirects if session user does not match profile user", async () => {
        mockUseSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user-1" } },
        });

        mockUseUser.mockReturnValue({
            isLoading: false,
            data: { id: "user-2", allowDeleteCreditCard: true },
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-2" }} />);

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/course-1"));
    });

    it("does not render credit card section if user cannot delete cards", () => {
        mockUseSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user-1" } },
        });

        mockUseUser.mockReturnValue({
            isLoading: false,
            data: {
                id: "user-1",
                allowDeleteCreditCard: false,
                bannerPicture: "/images/banner.png",
            },
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);
        expect(screen.queryByText(/Saved Credit Cards/i)).not.toBeInTheDocument();
    });
});
