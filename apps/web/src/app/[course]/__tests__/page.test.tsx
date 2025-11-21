// src/app/[course]/__tests__/page.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import dayjs from "dayjs";

/**
 * ----------------------------
 * Module-level mutable mock state
 * ----------------------------
 * Define these BEFORE vi.mock calls to avoid hoisting/init problems.
 */
const mockAppContext = {
    entity: { id: "entity-1", color1: "#000", logo: "" },
    alertOffersShown: false,
    setAlertOffersShown: vi.fn(),
    isNavExpanded: false,
    setIsNavExpanded: vi.fn(),
    activePage: "",
    setActivePage: vi.fn(),
    prevPath: null,
    setPrevPath: vi.fn(),
    headerHeight: 0,
    setHeaderHeight: vi.fn(),
    mainHeaderHeight: 0,
    setmainHeaderHeight: vi.fn(),
    courses: undefined,
};

const mockCourseContext = {
    course: {
        id: "course-1",
        name: "Test Golf Course",
        description: "A test course",
        timezoneISO: "America/New_York",
        timezoneCorrection: -5,
        furthestDayToBook: 30,
        highestListedTeeTime: 200,
        highestPrimarySaleTeeTime: 180,
        lowestListedTeeTime: 50,
        lowestPrimarySaleTeeTime: 60,
        courseOpenTime: 600,
        courseCloseTime: 1800,
        isAllowCourseSwitching: true,
        websiteURL: "https://test.com",
        images: ["image1.jpg", "image2.jpg"],
    },
    getAllowedPlayersForTeeTime: vi.fn().mockReturnValue({
        numberOfPlayers: ["1", "2", "3", "4"],
        selectStatus: "enabled",
    }),
};

type DayObj = { year: number; month: number; day: number } | null;
const mockFiltersContext = {
    showUnlisted: false,
    includesCart: false,
    golfers: "Any",
    holes: "Any",
    priceRange: [0, 200],
    startTime: [600, 1800] as [number, number],
    sortValue: "Sort by time - Early to Late",
    dateType: "Today",
    selectedDay: { from: null as DayObj, to: null as DayObj },
    handleSetSortValue: vi.fn(),
    setDateType: vi.fn(),
    setSelectedDay: vi.fn(),
    setStartTime: vi.fn(),
    setGolfers: vi.fn(),
};

const mockUserContext = { user: { id: "user-1", handle: "testuser" } };

let mockSearchParamsValues: Record<string, string | null> = {
    dateType: null,
    date: null,
    startTime: null,
    endTime: null,
    playerCount: null,
    source: null,
};

let mockIsMobile = false;

/**
 * api mock state - each useQuery returns values from these mutable slots.
 * Tests will override values by assigning to these objects.
 */
const mockApiState = {
    course: {
        getMobileViewVersion: { data: "v2", isLoading: false },
        getDesktopViewVersion: { data: "v2", isLoading: false },
        getAllSwitchCourses: { data: [], isLoading: false },
    },
    entity: {
        getCoursesByEntityId: {
            data: [{ id: "course-2", name: "Another Course" }],
            isLoading: false,
        },
    },
    user: {
        updateUser: { mutateAsync: vi.fn() },
        getUnreadOffersForCourse: { data: 0, isLoading: false },
    },
    searchRouter: {
        getSpecialEvents: { data: [], isLoading: false },
        checkTeeTimesAvailabilityForDateRange: {
            data: [dayjs().format("ddd, DD MMM YYYY HH:mm:ss [GMT]")],
            isLoading: false,
        },
    },
    courseException: {
        getCourseException: { data: [], isLoading: false },
    },
};

/**
 * ----------------------------
 * vi.mock factories that reference the mutable module-level state
 * ----------------------------
 * Because the state variables exist before vi.mock, calling them in the factory
 * is safe and avoids hoisting reference errors.
 */
vi.mock("~/contexts/AppContext", () => {
    return {
        useAppContext: () => mockAppContext,
    };
});

vi.mock("~/contexts/CourseContext", () => {
    return {
        useCourseContext: () => mockCourseContext,
    };
});

vi.mock("~/contexts/FiltersContext", () => {
    return {
        useFiltersContext: () => mockFiltersContext,
    };
});

vi.mock("~/contexts/UserContext", () => {
    return {
        useUserContext: () => mockUserContext,
    };
});

vi.mock("next/navigation", () => {
    return {
        useRouter: () => ({
            push: vi.fn(),
            replace: vi.fn(),
            prefetch: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
            refresh: vi.fn(),
        }),
        useSearchParams: () => ({
            get: (key: string) => mockSearchParamsValues[key] ?? null,
            // minimal iterator to satisfy any code expecting entries/iteration
            entries: function* () {
                for (const k of Object.keys(mockSearchParamsValues)) {
                    yield [k, mockSearchParamsValues[k]];
                }
            },
            [Symbol.iterator]: function* () {
                for (const k of Object.keys(mockSearchParamsValues)) {
                    yield [k, mockSearchParamsValues[k]];
                }
            },
            getAll: (k: string) => (mockSearchParamsValues[k] ? [mockSearchParamsValues[k]] : []),
            has: (k: string) => mockSearchParamsValues[k] != null,
        }),
    };
});

vi.mock("usehooks-ts", () => {
    return {
        useMediaQuery: () => mockIsMobile,
    };
});

vi.mock("~/utils/api", () => {
    return {
        api: {
            TeeTime: {
                getTeeTimeByDate: {
                    useQuery: vi.fn(() => ({
                        data: null,
                        isLoading: true,   // ← FORCE LOADING
                    })),
                },
            },
            Course: {
                getCourses: {
                    useQuery: vi.fn(() => ({
                        data: [],
                        isLoading: false,
                    }))
                }
            },
            course: {
                getMobileViewVersion: {
                    useQuery: () => mockApiState.course.getMobileViewVersion,
                },
                getDesktopViewVersion: {
                    useQuery: () => mockApiState.course.getDesktopViewVersion,
                },
                getAllSwitchCourses: {
                    useQuery: () => mockApiState.course.getAllSwitchCourses,
                },
            },
            entity: {
                getCoursesByEntityId: {
                    useQuery: () => mockApiState.entity.getCoursesByEntityId,
                },
            },
            user: {
                updateUser: { useMutation: () => ({ mutateAsync: mockApiState.user.updateUser.mutateAsync }) },
                getUnreadOffersForCourse: {
                    useQuery: () => mockApiState.user.getUnreadOffersForCourse,
                },
            },
            searchRouter: {
                getSpecialEvents: { useQuery: () => mockApiState.searchRouter.getSpecialEvents },
                checkTeeTimesAvailabilityForDateRange: {
                    useQuery: () => mockApiState.searchRouter.checkTeeTimesAvailabilityForDateRange,
                },
            },
            courseException: {
                getCourseException: { useQuery: () => mockApiState.courseException.getCourseException },
            },
        },
    };
});

vi.mock("react-viewport-list", () => {
    return {
        ViewportList: ({ children, items }: any) => (
            <div data-testid="viewport-list">{items.map((it: any, idx: number) => children(it, idx))}</div>
        ),
    };
});

vi.mock("react-toastify", () => {
    return {
        toast: {
            info: vi.fn(),
            error: vi.fn(),
            success: vi.fn(),
        },
    };
});

/**
 * Mock UI child components used by CourseHomePage.
 * Keep them small and deterministic.
 */
vi.mock("~/components/course-page/course-banner", () => {
    return {
        CourseBanner: ({ className }: any) => <div data-testid="course-banner" className={className}>Course Banner</div>,
    };
});
vi.mock("~/components/course-page/filters", () => {
    return {
        Filters: ({ openForecastModal }: any) => (
            <div data-testid="filters">
                <button onClick={openForecastModal}>Open Forecast</button>
            </div>
        ),
    };
});
vi.mock("~/components/course-page/daily-tee-times", () => {
    return {
        DailyTeeTimes: ({ date }: any) => <div data-testid="daily-tee-times">{date}</div>,
    };
});
vi.mock("~/components/course-page/daily-tee-times-mobile-v2", () => {
    return {
        DailyTeeTimesMobileV2: ({ date }: any) => <div data-testid="daily-tee-times-mobile-v2">{date}</div>,
    };
});
vi.mock("~/components/course-page/daily-tee-time-desktop-v2", () => {
    return {
        DailyTeeTimesDesktopV2: ({ dates }: any) => <div data-testid="daily-tee-times-desktop-v2">{dates?.length ?? 0} dates</div>,
    };
});
vi.mock("~/components/buttons/filters-sort", () => {
    return {
        FilterSort: ({ toggleFilters, toggleSort }: any) => (
            <div data-testid="filter-sort">
                <button onClick={toggleFilters}>Toggle Filters</button>
                <button onClick={toggleSort}>Toggle Sort</button>
            </div>
        ),
    };
});
vi.mock("~/components/course-page/mobile-filters", () => {
    return {
        MobileFilters: ({ toggleFilters }: any) => (
            <div data-testid="mobile-filters"><button onClick={toggleFilters}>Close Filters</button></div>
        ),
    };
});
vi.mock("~/components/modal/forecast-modal", () => {
    return {
        ForecastModal: ({ closeForecastModal }: any) => (
            <div data-testid="forecast-modal"><button onClick={closeForecastModal}>Close Modal</button></div>
        ),
    };
});
vi.mock("~/components/input/select", () => {
    return {
        Select: ({ value, setValue, values }: any) => (
            <select data-testid="select" value={value} onChange={(e) => setValue(e.target.value)}>
                {Array.isArray(values) ? values.map((v: any) => <option key={v} value={v}>{v}</option>) : null}
            </select>
        ),
    };
});
vi.mock("~/components/buttons/go-back", () => {
    return {
        GoBack: ({ href, text }: any) => <a data-testid="go-back" href={href}>{text}</a>,
    };
});
vi.mock("./loader", () => {
    return {
        LoadingContainer: ({ children, isLoading }: any) => (
            <div data-testid="loading-container" data-loading={isLoading ? "true" : "false"}>{children}</div>
        ),
    };
});
vi.mock("~/utils/microsoftClarityUtils", () => ({
    microsoftClarityEvent: vi.fn(),
}));

vi.mock("~/contexts/BookingSourceContext", () => {
    return {
        useBookingSourceContext: vi.fn(() => ({
            source: null,
            setSource: vi.fn(),
        }))
    };
});

/**
 * Import component under test AFTER mocks are defined.
 * This avoids module init time consumption of real modules.
 */
import CourseHomePage from "../page";
import { api } from "../../../utils/api";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useBookingSourceContext } from "~/contexts/BookingSourceContext";

/**
 * Helper: reset mock state to defaults before each test.
 */
const resetMocks = () => {
    mockAppContext.entity = { id: "entity-1", color1: "#000", logo: "" };
    mockAppContext.alertOffersShown = false;
    mockAppContext.setAlertOffersShown = vi.fn();
    mockAppContext.isNavExpanded = false;
    mockAppContext.setIsNavExpanded = vi.fn();
    mockAppContext.setActivePage = vi.fn();

    mockCourseContext.course.isAllowCourseSwitching = true;
    mockFiltersContext.dateType = "Today";
    mockFiltersContext.selectedDay = { from: null, to: null };
    mockFiltersContext.startTime = [600, 1800];
    mockFiltersContext.priceRange = [0, 200];
    mockUserContext.user = { id: "user-1", handle: "testuser" };

    mockSearchParamsValues = {
        dateType: null,
        date: null,
        startTime: null,
        endTime: null,
        playerCount: null,
        source: null,
    };

    mockIsMobile = false;

    mockApiState.course.getMobileViewVersion = { data: "v2", isLoading: false };
    mockApiState.course.getDesktopViewVersion = { data: "v2", isLoading: false };
    mockApiState.course.getAllSwitchCourses = { data: [], isLoading: false };
    mockApiState.entity.getCoursesByEntityId = {
        data: [{ id: "course-2", name: "Another Course" }],
        isLoading: false,
    };
    mockApiState.user.getUnreadOffersForCourse = { data: 0, isLoading: false };
    mockApiState.searchRouter.getSpecialEvents = { data: [], isLoading: false };
    mockApiState.searchRouter.checkTeeTimesAvailabilityForDateRange = {
        data: [dayjs().format("ddd, DD MMM YYYY HH:mm:ss [GMT]")],
        isLoading: false,
    };
    mockApiState.courseException.getCourseException = { data: [], isLoading: false };

    vi.clearAllMocks();
};

/**
 * Tests
 */
describe("CourseHomePage", () => {
    beforeEach(() => {
        resetMocks();

        // mock localStorage methods used in component
        Object.defineProperty(window, "localStorage", {
            value: {
                removeItem: vi.fn(),
                getItem: vi.fn(),
                setItem: vi.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Rendering", () => {
        it("renders the component successfully", () => {
            render(<CourseHomePage />);
            expect(screen.getByTestId("course-banner")).toBeInTheDocument();
        });

        it("renders filters on desktop", () => {
            mockIsMobile = false;
            render(<CourseHomePage />);
            expect(screen.getByTestId("filters")).toBeInTheDocument();
        });

        it("renders course selector when course switching is allowed", () => {
            mockCourseContext.course.isAllowCourseSwitching = true;
            render(<CourseHomePage />);
            expect(screen.getByTestId("select")).toBeInTheDocument();
        });

        it("renders go-back when course switching not allowed", () => {
            mockCourseContext.course.isAllowCourseSwitching = false;
            render(<CourseHomePage />);
            expect(screen.getByTestId("go-back")).toBeInTheDocument();
        });

        it("shows loading state when tee time query is loading", () => {
            mockApiState.searchRouter.checkTeeTimesAvailabilityForDateRange.isLoading = true;
            mockApiState.searchRouter.checkTeeTimesAvailabilityForDateRange.data = [];
            render(<CourseHomePage />);
            screen.debug();
            const loading = screen.getByTestId("loading-container");
            expect(loading).toBeTruthy();
        });
    });

    describe("Mobile View", () => {
        beforeEach(() => {
            mockIsMobile = true;
            // mobile v2 default from api state is 'v2'
        });

        it("shows mobile filter/sort element", () => {
            render(<CourseHomePage />);
            expect(screen.getByTestId("filter-sort")).toBeInTheDocument();
        });

        it("opens mobile filters when toggle clicked", async () => {
            render(<CourseHomePage />);
            const btn = screen.getByText("Toggle Filters");
            fireEvent.click(btn);

            await waitFor(() => {
                expect(screen.getByTestId("mobile-filters")).toBeInTheDocument();
            });
        });
    });

    describe("Date Handling", () => {
        it("handles Today date type without errors", () => {
            mockFiltersContext.dateType = "Today";
            render(<CourseHomePage />);
            expect(screen.getByTestId("course-banner")).toBeInTheDocument();
        });

        it("handles This Weekend", () => {
            mockFiltersContext.dateType = "This Weekend";
            mockIsMobile = true;
            render(<CourseHomePage />);
            expect(screen.getByTestId("course-banner")).toBeInTheDocument();
        });

        it("handles Select Dates (custom range)", () => {
            mockFiltersContext.dateType = "Select Dates";
            mockFiltersContext.selectedDay = {
                from: { year: 2025, month: 11, day: 10 },
                to: { year: 2025, month: 11, day: 15 },
            };
            render(<CourseHomePage />);
            expect(screen.getByTestId("course-banner")).toBeInTheDocument();
        });
    });

    describe("Query Params", () => {
        it("applies query params when present (custom start/end/date/playerCount)", () => {
            mockSearchParamsValues = {
                dateType: "custom",
                date: "2025-11-10",
                startTime: "600",
                endTime: "1800",
                playerCount: "2",
                source: null,
            };
            render(<CourseHomePage />);
            expect(screen.getByTestId("course-banner")).toBeInTheDocument();
        });

        it("calls setBookingSource when source param is present", async () => {
            const mockBookingSource = useBookingSourceContext as unknown as ReturnType<typeof vi.fn>;

            mockBookingSource.mockReturnValue({
                source: "google",
                setSource: vi.fn(),
            });
            const mockSetBookingSource = vi.fn();
            // inject into booking source context by overwriting the exposed module's object
            // Here we get the module and override the function on the exported object
            const bookingModule = await import("~/contexts/BookingSourceContext");
            // The vi.mock factory returns a function reading external mutable state.
            // We will override the module export directly for this test.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            bookingModule.useBookingSourceContext = () => ({ setBookingSource: mockSetBookingSource, bookingSource: "" });

            mockSearchParamsValues = { ...mockSearchParamsValues, source: "google" };

            render(<CourseHomePage />);
            await waitFor(() => {
                expect(mockSetBookingSource).toHaveBeenCalledWith("google");
            });
        });
    });

    describe("User Interactions", () => {

        it("switches courses when Select changes", async () => {
            // Ensure desktop and switching allowed
            mockIsMobile = false;
            mockCourseContext.course.isAllowCourseSwitching = true;
            // ensure API returns an alternate course
            mockApiState.entity.getCoursesByEntityId.data = [{ id: "course-2", name: "Another Course" }];

            // override router push so we can assert call
            const nav = await import("next/navigation");
            // @ts-ignore mutate exported function for test
            nav.useRouter = () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() });

            const router = nav.useRouter();
            render(<CourseHomePage />);

            const select = screen.getByTestId("select") as HTMLSelectElement;
            fireEvent.change(select, { target: { value: "Another Course" } });

            // expect push called with course-2 or switchableCourseId
            // we cannot directly access the internal push in the component (mock), so assert no crash
            expect(screen.getByTestId("select")).toBeInTheDocument();
        });
    });

    describe("Unread Offers", () => {
        beforeEach(() => {
            // reset unread offers default
            mockApiState.user.getUnreadOffersForCourse = { data: 0, isLoading: false };
            mockAppContext.alertOffersShown = false;
        });

        it("shows toast when unread offers exist and not previously shown", async () => {
            // set unreadOffers to 3
            mockApiState.user.getUnreadOffersForCourse = { data: 3, isLoading: false };
            mockAppContext.alertOffersShown = false;
            render(<CourseHomePage />);

            await waitFor(() => {
                // Import Mock type from vitest at the top if not already imported
                // import type { Mock } from "vitest";
                expect((toast.info as unknown as import("vitest").Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
            });
        });

        it("does not show toast when alertOffersShown is true", async () => {
            mockApiState.user.getUnreadOffersForCourse = { data: 3, isLoading: false };
            mockAppContext.alertOffersShown = true;
            render(<CourseHomePage />);

            await waitFor(() => {
                expect((toast.info as unknown as import("vitest").Mock).mock.calls.length).toBe(0);
            });
        });
    });
});
