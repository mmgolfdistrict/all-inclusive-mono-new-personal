// Mock API
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
                    data: { autocompleteCities: { features: [{ place_name: "New York" }, { place_name: "Los Angeles" }, { place_name: "Chicago" }] } },
                    isLoading: false,
                }),
            },
        },
        checkout: {
            retrievePaymentMethods: {
                useQuery: ({ customerId }: { customerId: string }) => ({
                    data: [],
                    isLoading: false,
                    refetch: vi.fn(),
                }),
            },
            createPaymentMethod: { useMutation: () => ({ mutate: vi.fn() }) },
            removePaymentMethod: { useMutation: () => ({ mutate: vi.fn() }) },
        },
    }
}));


import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ManageProfile from "../page";
import { useSession } from "@golf-district/auth/nextjs-exports";
import { useUser } from "~/hooks/useUser";
import { useAppContext } from "~/contexts/AppContext";
import { NotificationSettings } from "~/components/account-settings-page/notification-settings";
import { EditProfileForm } from "~/components/account-settings-page/edit-profile-form";

vi.mock("~/hooks/useMe", () => ({
    useMe: () => ({ user: { id: "1", name: "John Doe" } })
}));

// ------------------ MOCKS ------------------ //

// Mock next/image to avoid width/height errors in tests
vi.mock("next/image", () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}));

// Mock hooks
vi.mock("@golf-district/auth/nextjs-exports");
const mockUserData = {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    handle: "testhandle",
    profilePicture: "/defaults/default-profile.webp",
    bannerPicture: "/defaults/default-banner.webp",
    phoneNumber: "1234567890",
    phoneNumberCountryCode: 1,
    address1: "123 Street",
    city: "City",
    state: "State",
    zipcode: "12345",
    country: "USA",
};

vi.mock('~/hooks/useUser', () => ({
    useUser: vi.fn(() => ({
        data: mockUserData,
        isLoading: false,
        refetch: vi.fn(),

    })),
}));

vi.mock("~/contexts/AppContext");

// Mock useRouter & useParams
const pushMock = vi.fn();
vi.mock("next/navigation", async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useRouter: vi.fn(() => ({ push: pushMock })),
        useParams: vi.fn(() => ({ userId: "user-1", course: "course-1" })),
    };
});

// Mock useAppContext
const setActivePageMock = vi.fn();
(useAppContext as any).mockReturnValue({ setActivePage: setActivePageMock });

// Mock window.matchMedia
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

    it("should render all child components when authenticated and correct user", async () => {
        (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "user-1" } } });
        (useUser as any).mockReturnValue({
            isLoading: false,
            data: {
                id: "user-1",
                allowDeleteCreditCard: true,
                bannerPicture: "/images/banner.png", // <-- ensure defined
                bannerImage: "banner-id",
            },
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);
        expect(setActivePageMock).toHaveBeenCalledWith("account-settings");

        expect(screen.getByText(/Back to tee times/i)).toBeInTheDocument();
        expect(screen.getByText(/Saved Credit Cards/i)).toBeInTheDocument();
        expect(screen.getByText(/Add New Credit Card/i)).toBeInTheDocument();
        expect(screen.getByText(/Available to Withdraw/i)).toBeInTheDocument();
        // Waits for element to appear asynchronously
        // const notification = await screen.findByTestId("profile-notification");
        // expect(notification).toBeTruthy();
        // const profileEditForm = await screen.findByTestId("profile-edit-form");
        // expect(profileEditForm).toBeTruthy();
        // expect(screen.getByText(/Profile Details/i)).toBeTruthy();
    });

    it("should redirect if unauthenticated", async () => {
        (useSession as any).mockReturnValue({ status: "unauthenticated", data: null });
        (useUser as any).mockReturnValue({ isLoading: false, data: null });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/course-1"));
    });

    it("should redirect if userId does not match session user", async () => {
        (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "user-1" } } });
        (useUser as any).mockReturnValue({ isLoading: false, data: { id: "user-2", allowDeleteCreditCard: true } });

        render(<ManageProfile params={{ course: "course-1", userId: "user-2" }} />);
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/course-1"));
    });

    it("should not render PaymentInfoMangeProfile if user disallows deleting cards", async () => {
        (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "user-1" } } });
        (useUser as any).mockReturnValue({
            isLoading: false,
            data: { id: "user-1", allowDeleteCreditCard: false, bannerPicture: "/images/banner.png" },
        });

        render(<ManageProfile params={{ course: "course-1", userId: "user-1" }} />);
        expect(screen.queryByText(/Saved Credit Cards/i)).not.toBeInTheDocument();
    });
});
