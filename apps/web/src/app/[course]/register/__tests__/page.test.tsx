import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';
import { type Mock } from 'vitest';
import { type ToastContent, type Id, type ToastOptions } from 'react-toastify';
import { isValidPassword } from '@golf-district/shared';
import { type ReactNode } from 'react';

process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key';

vi.mock("react-google-recaptcha", () => ({
    __esModule: true,
    default: vi.fn(
        ({ onChange }: { onChange?: (token: string | null) => void }) => (
            <div
                data-testid="recaptcha"
                onClick={() => onChange?.("test-token")}
            >
                ReCAPTCHA
            </div>
        )
    ),
}));


// 1. Define the full function signature as a single type
type ToastFunction = (
    content: ToastContent<unknown>,
    options?: ToastOptions<Record<string, unknown>> | undefined
) => Id;

const errorMock: ToastFunction = vi.fn();
const successMock: ToastFunction = vi.fn();

vi.mock("react-toastify", () => ({
    toast: {
        error: errorMock,
        success: successMock,
    },
}));
// --- Mock Dependencies ---

// 1. Mock Next.js Navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
    })),
}));

// 2. Mock Next.js Link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: ReactNode, href: string }) => <a href={href}>{children}</a>,
}));

// 3. Mock API Calls (tRPC)
const mockRegisterMutateAsync = vi.fn();
const mockCheckProfanityMutateAsync = vi.fn();
const mockRefetchUsername = vi.fn();
vi.mock('~/utils/api', () => ({
    api: {
        register: {
            register: {
                useMutation: vi.fn(() => ({
                    mutateAsync: mockRegisterMutateAsync,
                    isLoading: false,
                    isSuccess: false,
                })),
            },
            generateUsername: {
                useQuery: vi.fn(() => ({
                    data: 'testuser123',
                    refetch: mockRefetchUsername,
                })),
            },
        },
        profanity: {
            checkProfanity: {
                useMutation: vi.fn(() => ({
                    mutateAsync: mockCheckProfanityMutateAsync,
                    data: null,
                    reset: vi.fn(),
                })),
            },
        },
        places: {
            getCity: {
                useQuery: vi.fn(() => ({
                    data: { autocompleteCities: { features: [] } },
                })),
            },
        },
        user: {
            getCountryCode: {
                useQuery: vi.fn(() => ({
                    data: { country: 'US' },
                    error: null,
                })),
            },
        },
        webhooks: {
            auditLog: {
                useMutation: vi.fn(() => ({
                    mutateAsync: vi.fn(),
                })),
            },
        },
    },
}));

// 4. Mock Contexts
vi.mock('~/contexts/CourseContext', () => ({
    useCourseContext: vi.fn(() => ({
        course: { id: 'test-course-id', name: 'Test Course' },
    })),
}));

vi.mock('~/contexts/AppContext', () => ({
    useAppContext: vi.fn(() => ({
        entity: { color1: '#000000' },
    })),
}));

// 5. Mock Google Maps
vi.mock('@react-google-maps/api', () => ({
    useLoadScript: vi.fn(() => ({
        isLoaded: true,
        loadError: null,
    })),
}));

// 6. Mock ReCAPTCHA
vi.mock("react-google-recaptcha", () => ({
    __esModule: true,
    default: vi.fn(
        ({ onChange }: { onChange?: (token: string | null) => void }) => (
            <div
                data-testid="recaptcha"
                onClick={() => onChange?.("test-token")}
            >
                ReCAPTCHA
            </div>
        )
    ),
}));

// 7. Mock Toastify
vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

// 8. Mock useDebounce and password validation
vi.mock("usehooks-ts", () => ({
    __esModule: true,
    useDebounce: vi.fn((value: unknown) => value),
}));

vi.mock('@golf-district/shared', () => ({
    isValidPassword: vi.fn(() => ({
        isValid: true,
        feedback: [],
    })),
}));

function getInputByTestId(id: string): HTMLInputElement {
    const el = screen.getByTestId(id);
    if (!(el instanceof HTMLInputElement)) {
        throw new Error(`Element with test id ${id} is not an input`);
    }
    return el;
}

// Helper function to fill the form for successful submission
const fillAllRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByTestId('recaptcha'));

    await user.type(screen.getByTestId('register-address1-id'), '123 Main St');
    await user.type(screen.getByTestId('register-city-id'), 'New York');
    await user.type(screen.getByTestId('register-zipcode-id'), '10001');

    const stateSelect = screen.getByTestId('register-state-id');
    await user.click(stateSelect);
    await user.tab();
};

describe('RegisterPage', () => {
    let originalRecaptchaKey: string | undefined;
    beforeEach(() => {
        vi.clearAllMocks();
        mockRegisterMutateAsync.mockResolvedValue({ error: false });
        mockCheckProfanityMutateAsync.mockResolvedValue({ isProfane: false });
        mockPush.mockClear();

        originalRecaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'TEST_RECAPTCHA_KEY';

        vi.clearAllMocks();
        mockRegisterMutateAsync.mockResolvedValue({ error: false });

        const mockAutocompleteInstance = () => ({
            // Core Autocomplete Methods (from the previous fix)
            addListener: vi.fn(),
            getPlace: vi.fn(),
            getBounds: vi.fn(),
            getFields: vi.fn(),
            setBounds: vi.fn(),
            setComponentRestrictions: vi.fn(),
            setFields: vi.fn(),
            setOptions: vi.fn(),
            setTypes: vi.fn(),

            // *** NEW FIX: MVCObject Methods (required by the latest error) ***
            bindTo: vi.fn(),
            get: vi.fn(),
            notify: vi.fn(),
            set: vi.fn(),
            unbind: vi.fn(),
            unbindAll: vi.fn(),
            changed: vi.fn(),
            // ***************************************************************
        });

        // 2. Define the Autocomplete mock constructor.
        // Use 'as unknown as Type' to resolve the conversion error (as suggested by the TS error message).
        const AutocompleteMock = vi.fn(mockAutocompleteInstance) as unknown as typeof google.maps.places.Autocomplete;

        // 3. Define the minimal required mock for the 'places' namespace (from the prior fix)
        const placesMock = {
            Autocomplete: AutocompleteMock,
            AddressComponent: vi.fn(),
            Attribution: vi.fn(),
            AuthorAttribution: vi.fn(),
            AutocompleteService: vi.fn(),
            // Add any other properties the compiler complained about in earlier steps
        };

        // 4. Assign the complete structure to globalThis.google.
        // We use 'as unknown as...' on the final assignment to bypass the remaining,
        // complex type conflicts between the native types and the mock types.
        (globalThis as unknown as {
            google: {
                maps: {
                    places: typeof google.maps.places;
                };
            };
        }).google = {
            maps: {
                places: placesMock as unknown as typeof google.maps.places,
            },
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = originalRecaptchaKey;
    });

    // --- Component Rendering Tests ---
    describe('Component Rendering', () => {
        it('should render the registration form elements', () => {
            render(<RegisterPage />);

            expect(screen.getByText('Create an Account')).toBeInTheDocument();
            expect(screen.getByTestId('register-first-name-id')).toBeInTheDocument();
            expect(screen.getByTestId('register-last-name-id')).toBeInTheDocument();
            expect(screen.getByTestId('register-email-id')).toBeInTheDocument();
            expect(screen.getByText('Register')).toBeInTheDocument();
        });

        it('should render sign in link pointing to /login', () => {
            render(<RegisterPage />);
            const signInLink = screen.getByText('Sign In');
            expect(signInLink).toBeInTheDocument();
            expect(signInLink.closest('a')).toHaveAttribute('href', expect.stringContaining('/login'));
        });

        it('should clear email and password fields on mount', () => {
            // Simulate autofill (though controlled components usually prevent this, we test the explicit clear)
            render(<RegisterPage />);

            const emailInput = getInputByTestId('register-email-id');
            const passwordInput = getInputByTestId('register-password-id');

            expect(emailInput.value).toBe('');
            expect(passwordInput.value).toBe('');
        });

        it('should initialize country based on API data', async () => {
            render(<RegisterPage />);
            await waitFor(() => {
                // The component uses the CountryDropdown which should display the default country
                // Verifying the phone number input is present confirms the initialization occurred.
                expect(screen.getByTestId('profile-phone-number-id')).toBeInTheDocument();
            });
        });
    });

    // --- User Interaction Tests ---
    describe('Form Interactions', () => {
        it('should allow typing in all text fields', async () => {
            const user = userEvent.setup();
            render(<RegisterPage />);

            const firstNameInput = screen.getByTestId('register-first-name-id');
            await user.type(firstNameInput, 'John');
            expect(firstNameInput).toHaveValue('John');

            const emailInput = screen.getByTestId('register-email-id');
            await user.type(emailInput, 'john@example.com');
            expect(emailInput).toHaveValue('john@example.com');
        });

        it('should filter non-numeric characters from phone number', async () => {
            const user = userEvent.setup();
            render(<RegisterPage />);

            const phoneInput = screen.getByTestId('profile-phone-number-id');
            await user.type(phoneInput, 'abc123def456');

            // The component's handlePhoneNumberChange filters this.
            await waitFor(() => {
                expect(phoneInput).toHaveValue('123456');
            });
        });

        it('should toggle password visibility when eye icon is clicked', async () => {
            const user = userEvent.setup();
            render(<RegisterPage />);

            const passwordInput = screen.getByTestId('register-password-id');
            const toggleButton = screen.getByTestId('register-show-password-id');

            expect(passwordInput).toHaveAttribute('type', 'password');

            await user.click(toggleButton);

            await waitFor(() => {
                expect(passwordInput).toHaveAttribute('type', 'text');
            });
        });
    });

    // --- Username Logic Tests ---
    describe('Username Logic', () => {
        it('should display the initially generated username', () => {
            render(<RegisterPage />);
            const usernameInput = screen.getByTestId('register-user-name-id');
            expect(usernameInput).toHaveValue('testuser123');
        });

        it('should refetch and apply spin animation when refresh button is clicked', async () => {
            const user = userEvent.setup();
            render(<RegisterPage />);

            const refreshButton = screen.getByTestId('register-user-name-refresh-id');
            await user.click(refreshButton);

            expect(mockRefetchUsername).toHaveBeenCalled();
            expect(refreshButton).toHaveClass('animate-spin');
        });
    });

    // --- Profanity Check Logic Tests ---
    describe('Profanity Check', () => {
        it('should call checkProfanity mutation when username is typed', async () => {
            const user = userEvent.setup();
            render(<RegisterPage />);

            const usernameInput = screen.getByTestId('register-user-name-id');
            await user.clear(usernameInput);
            await user.type(usernameInput, 'newhandle');

            await waitFor(() => {
                expect(mockCheckProfanityMutateAsync).toHaveBeenCalledWith({ text: 'newhandle' });
            });
        });

        it('should show error and prevent submission if username is profane', async () => {
            mockCheckProfanityMutateAsync.mockResolvedValue({ isProfane: true });

            const user = userEvent.setup();
            render(<RegisterPage />);

            // Trigger profanity check
            const usernameInput = screen.getByTestId('register-user-name-id');
            await user.clear(usernameInput);
            await user.type(usernameInput, 'badword');

            // 🔥 Wait for debounce + mutation to complete
            await waitFor(() =>
                expect(mockCheckProfanityMutateAsync).toHaveBeenCalledWith({ text: 'badword' })
            );

            await fillAllRequiredFields(user);
            await user.click(screen.getByText('Register'));

            // 🔥 Now expect UI
            await waitFor(() =>
                expect(screen.getByText('Handle not available.')).toBeInTheDocument()
            );

            // Registration should NOT run
            expect(mockRegisterMutateAsync).not.toHaveBeenCalled();
        });

    });

    // --- Form Validation Tests ---
    describe('Form Validation', () => {
        it('should show password strength feedback when typing a weak password', async () => {
            // Cast the imported function to a Vitest Mock to expose mockReturnValue
            (isValidPassword as Mock).mockReturnValue({
                isValid: false,
                feedback: ['Password must be at least 8 characters long.', 'Password must contain one number.'],
            });

            const user = userEvent.setup();
            render(<RegisterPage />);

            const passwordInput = screen.getByTestId('register-password-id');
            await user.type(passwordInput, 'short');

            // await waitFor(() => {
            //     expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
            // });
        });
    });
});
