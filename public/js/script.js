// Use production API URL or fallback to localhost
const API = window.location.hostname === "localhost" 
    ? "http://localhost:5000/api" 
    : "https://placement-portal-k7xf.onrender.com/api";
const APP_THEME_KEY = "appTheme";
const STUDENT_LOGIN_ROUTE = "student-login.html";
const COMPANY_LOGIN_ROUTE = "student-login.html?role=company";

// Cursor tracking for grid glow effect
document.addEventListener("mousemove", (e) => {
    document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
});

window.customAlert = function(message, title = "Notification") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "custom-modal-overlay";
        overlay.innerHTML = `
            <div class="custom-modal-box">
                <div class="custom-modal-title">${title}</div>
                <div class="custom-modal-message">${message}</div>
                <div class="custom-modal-actions">
                    <button class="btn btn-primary" id="modalOkBtn">Continue</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));
        const cleanup = () => {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.remove(); resolve(); }, 300);
        };
        overlay.querySelector("#modalOkBtn").addEventListener("click", cleanup);
    });
};

window.customConfirm = function(message, title = "Confirm Action") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "custom-modal-overlay";
        overlay.innerHTML = `
            <div class="custom-modal-box">
                <div class="custom-modal-title">${title}</div>
                <div class="custom-modal-message">${message}</div>
                <div class="custom-modal-actions">
                    <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
                    <button class="btn btn-primary" id="modalConfirmBtn" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); color: #fca5a5;">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));
        const cleanup = (result) => {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.remove(); resolve(result); }, 300);
        };
        overlay.querySelector("#modalCancelBtn").addEventListener("click", () => cleanup(false));
        overlay.querySelector("#modalConfirmBtn").addEventListener("click", () => cleanup(true));
    });
};

window.customPrompt = function(message, defaultValue = "", title = "Input required") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "custom-modal-overlay";
        overlay.innerHTML = `
            <div class="custom-modal-box">
                <div class="custom-modal-title">${title}</div>
                <div class="custom-modal-message" style="margin-bottom:16px;">${message}</div>
                <div class="custom-modal-inputs">
                    <input type="text" id="modalInput" value="${defaultValue}" />
                </div>
                <div class="custom-modal-actions">
                    <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
                    <button class="btn btn-primary" id="modalConfirmBtn">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            overlay.classList.add("show");
            overlay.querySelector("#modalInput").focus();
        });
        const cleanup = (val) => {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.remove(); resolve(val); }, 300);
        };
        overlay.querySelector("#modalCancelBtn").addEventListener("click", () => cleanup(null));
        overlay.querySelector("#modalConfirmBtn").addEventListener("click", () => {
            cleanup(overlay.querySelector("#modalInput").value);
        });
    });
};

function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

function setError(message) {
    const errorNode = document.getElementById("error");

    if (errorNode) {
        errorNode.innerText = message || "";
    }
}

const BRANCH_OPTIONS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI&DS", "AIML"];
const YEAR_OPTIONS = [1, 2, 3, 4];
const OTHER_BRANCH_VALUE = "__OTHER__";
const LANGUAGE_OPTIONS = [
    "C",
    "C++",
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "Go",
    "PHP",
    "SQL",
    "MongoDB"
];

function populateSelectOptions(elementId, options, placeholder, formatter = (value) => value) {
    const select = document.getElementById(elementId);

    if (!select) {
        return;
    }

    select.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = String(option);
        optionElement.textContent = formatter(option);
        select.appendChild(optionElement);
    });
}

function appendSelectOptionIfMissing(select, value, label = value) {
    if (!select || !value) {
        return;
    }

    const hasOption = Array.from(select.options).some(
        (option) => option.value.toLowerCase() === String(value).toLowerCase()
    );

    if (hasOption) {
        return;
    }

    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(label);
    select.appendChild(option);
}

function addOtherBranchOption(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        return;
    }

    appendSelectOptionIfMissing(select, OTHER_BRANCH_VALUE, "Other (Type manually)");
}

function setupCustomBranchToggle(selectId, customFieldId, customInputId) {
    const select = document.getElementById(selectId);
    const customField = document.getElementById(customFieldId);
    const customInput = document.getElementById(customInputId);

    if (!select || !customField || !customInput) {
        return;
    }

    const sync = () => {
        const useCustom = select.value === OTHER_BRANCH_VALUE;
        customField.style.display = useCustom ? "flex" : "none";
        customInput.required = useCustom;
        if (!useCustom) {
            customInput.value = "";
        }
    };

    select.addEventListener("change", sync);
    sync();
}

function parseCustomCommaList(value) {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function uniqueValues(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
        const normalized = String(value).trim();
        if (!normalized) {
            return;
        }
        const key = normalized.toLowerCase();
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        result.push(normalized);
    });
    return result;
}

function getBranchValue(selectId, customInputId) {
    const select = document.getElementById(selectId);
    if (!select) {
        return "";
    }

    if (select.value === OTHER_BRANCH_VALUE) {
        return String(document.getElementById(customInputId)?.value || "").trim();
    }

    return String(select.value || "").trim();
}

function getLanguageValues(fieldName, customInputId) {
    const selected = getChoiceValues(fieldName);
    const custom = parseCustomCommaList(document.getElementById(customInputId)?.value || "");
    return uniqueValues([...selected, ...custom]);
}

function setSelectOrCustomBranch(selectId, customFieldId, customInputId, branchValue) {
    const select = document.getElementById(selectId);
    const customField = document.getElementById(customFieldId);
    const customInput = document.getElementById(customInputId);
    const value = String(branchValue || "").trim();

    if (!select) {
        return;
    }

    if (!value) {
        select.value = "";
        if (customField) customField.style.display = "none";
        if (customInput) {
            customInput.value = "";
            customInput.required = false;
        }
        return;
    }

    const matchingOption = Array.from(select.options).find(
        (option) => option.value.toLowerCase() === value.toLowerCase()
    );

    if (matchingOption) {
        select.value = matchingOption.value;
        if (customField) customField.style.display = "none";
        if (customInput) {
            customInput.value = "";
            customInput.required = false;
        }
        return;
    }

    select.value = OTHER_BRANCH_VALUE;
    if (customField) customField.style.display = "flex";
    if (customInput) {
        customInput.value = value;
        customInput.required = true;
    }
}

function renderChoiceGroup(containerId, fieldName, options) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = options
        .map(
            (option) => `
                <label class="choice-chip">
                    <input type="checkbox" name="${fieldName}" value="${option}" />
                    <span>${option}</span>
                </label>
            `
        )
        .join("");
}

function getChoiceValues(fieldName) {
    return Array.from(document.querySelectorAll(`input[name="${fieldName}"]:checked`)).map(
        (input) => input.value
    );
}

function setChoiceValues(fieldName, values) {
    const valueSet = new Set((values || []).map((value) => String(value)));
    document.querySelectorAll(`input[name="${fieldName}"]`).forEach((input) => {
        input.checked = valueSet.has(input.value);
    });
}

function initializeFormOptions() {
    populateSelectOptions("branch", BRANCH_OPTIONS, "Select branch");
    populateSelectOptions("yearOfStudy", YEAR_OPTIONS, "Select year", (value) => `Year ${value}`);
    populateSelectOptions("editBranch", BRANCH_OPTIONS, "Select branch");
    populateSelectOptions("editYearOfStudy", YEAR_OPTIONS, "Select year", (value) => `Year ${value}`);
    populateSelectOptions("filterEligibleBranch", BRANCH_OPTIONS, "Any branch");
    populateSelectOptions("filterEligibleYear", YEAR_OPTIONS, "Any year", (value) => `Year ${value}`);
    populateSelectOptions("filterLanguage", LANGUAGE_OPTIONS, "Any language");
    populateSelectOptions("filterStudentBranch", BRANCH_OPTIONS, "Any branch");
    populateSelectOptions("filterStudentYear", YEAR_OPTIONS, "Any year", (value) => `Year ${value}`);
    populateSelectOptions("filterStudentLanguage", LANGUAGE_OPTIONS, "Any language");
    populateSelectOptions("adminStudentBranchFilter", BRANCH_OPTIONS, "Any branch");
    populateSelectOptions("adminStudentYearFilter", YEAR_OPTIONS, "Any year", (value) => `Year ${value}`);
    populateSelectOptions("adminCompanyBranchFilter", BRANCH_OPTIONS, "Any eligible branch");
    populateSelectOptions("adminCompanyYearFilter", YEAR_OPTIONS, "Any eligible year", (value) => `Year ${value}`);
    populateSelectOptions("adminCompanyLanguageFilter", LANGUAGE_OPTIONS, "Any language");

    renderChoiceGroup("studentLanguageChoices", "studentLanguages", LANGUAGE_OPTIONS);
    renderChoiceGroup("editStudentLanguageChoices", "editStudentLanguages", LANGUAGE_OPTIONS);
    renderChoiceGroup("eligibleBranchChoices", "eligibleBranches", BRANCH_OPTIONS);
    renderChoiceGroup("editEligibleBranchChoices", "editEligibleBranches", BRANCH_OPTIONS);
    renderChoiceGroup("eligibleYearChoices", "eligibleYears", YEAR_OPTIONS.map(String));
    renderChoiceGroup("editEligibleYearChoices", "editEligibleYears", YEAR_OPTIONS.map(String));
    renderChoiceGroup("requiredLanguageChoices", "requiredLanguages", LANGUAGE_OPTIONS);
    renderChoiceGroup("editRequiredLanguageChoices", "editRequiredLanguages", LANGUAGE_OPTIONS);

    addOtherBranchOption("branch");
    addOtherBranchOption("editBranch");
    setupCustomBranchToggle("branch", "branchCustomField", "customBranch");
    setupCustomBranchToggle("editBranch", "editBranchCustomField", "editCustomBranch");
}

function enhanceSelects() {
    return;
}

function initializePasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach((input) => {
        if (input.closest(".password-field")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "password-field";
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "password-toggle";
        toggleButton.setAttribute("aria-label", "Show password");
        toggleButton.setAttribute("aria-pressed", "false");
        toggleButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M1.5 12s3.8-7 10.5-7 10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12Z"></path>
                <circle cx="12" cy="12" r="3.25"></circle>
            </svg>
        `;

        toggleButton.addEventListener("click", () => {
            const revealPassword = input.type === "password";
            input.type = revealPassword ? "text" : "password";
            toggleButton.classList.toggle("is-visible", revealPassword);
            toggleButton.setAttribute("aria-label", revealPassword ? "Hide password" : "Show password");
            toggleButton.setAttribute("aria-pressed", String(revealPassword));
        });

        wrapper.appendChild(toggleButton);
    });
}

function initializeAuthStorySliders() {
    const sliders = Array.from(document.querySelectorAll("[data-story-slider]"));

    sliders.forEach((slider) => {
        const slides = Array.from(slider.querySelectorAll(".story-card-slider .story-slide"));
        const cardSlider = slider.querySelector(".story-card-slider");
        const storySection = slider.closest(".auth-story");
        const prevButton = storySection?.querySelector("[data-story-prev]");
        const nextButton = storySection?.querySelector("[data-story-next]");
        const dots = Array.from(storySection?.querySelectorAll(".story-dot") || []);

        if (slides.length <= 1) {
            return;
        }

        let currentIndex = 0;
        let intervalId = null;
        let resizeTimer = null;

        const syncSliderHeight = () => {
             // Disable JS calculating height here as CSS grid handles it natively!
        };

        const showSlide = (index) => {
            currentIndex = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle("active", slideIndex === currentIndex);
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle("active", dotIndex === currentIndex);
            });
        };

        const startAuto = () => {
            clearInterval(intervalId);
            intervalId = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 4200);
        };

        prevButton?.addEventListener("click", () => {
            showSlide(currentIndex - 1);
            startAuto();
        });

        nextButton?.addEventListener("click", () => {
            showSlide(currentIndex + 1);
            startAuto();
        });

        dots.forEach((dot) => {
            const rawIndex = Number(dot.dataset.slideIndex);
            if (!Number.isFinite(rawIndex)) {
                return;
            }

            dot.addEventListener("click", () => {
                showSlide(rawIndex);
                startAuto();
            });
        });

        syncSliderHeight();
        showSlide(0);
        startAuto();

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(syncSliderHeight, 120);
        });
    });
}

function initializeLoginThemeToggle() {
    const body = document.body;

    if (!body || !body.classList.contains("login-fit-page")) {
        return;
    }

    const toggle = document.querySelector("[data-theme-toggle]");

    if (!toggle) {
        return;
    }

    const pageName = window.location.pathname.split("/").pop() || "unknown-page";
    const logThemeChange = async (mode) => {
        const payload = {
            mode,
            page: pageName,
            changedAt: new Date().toISOString()
        };

        console.info(`[Theme Toggle] ${mode.toUpperCase()} on ${pageName}`, payload.changedAt);

        try {
            await fetch(`${API}/auth/theme-log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn("Theme log API failed:", error);
        }
    };

    const applyTheme = (isNight) => {
        body.classList.toggle("night-theme", isNight);
        toggle.classList.toggle("is-night", isNight);
        toggle.setAttribute("aria-label", isNight ? "Dark mode active" : "Light mode active");
        toggle.setAttribute("title", isNight ? "Dark mode active" : "Light mode active");
        toggle.setAttribute("aria-pressed", String(isNight));
    };

    const syncThemeFromStorage = () => {
        const storedTheme = localStorage.getItem(APP_THEME_KEY);
        applyTheme(storedTheme !== "light");
    };

    syncThemeFromStorage();

    toggle.addEventListener("click", () => {
        const nextIsNight = !body.classList.contains("night-theme");
        applyTheme(nextIsNight);
        const nextMode = nextIsNight ? "dark" : "light";
        localStorage.setItem(APP_THEME_KEY, nextMode);
        logThemeChange(nextMode);
        window.dispatchEvent(new CustomEvent("app-theme-change", { detail: { mode: nextMode } }));
    });

    window.addEventListener("storage", (event) => {
        if (event.key !== APP_THEME_KEY) {
            return;
        }
        syncThemeFromStorage();
    });

    window.addEventListener("app-theme-change", (event) => {
        const mode = event.detail?.mode || "dark";
        applyTheme(mode !== "light");
    });
}

function initializeGlobalThemeToggle() {
    const body = document.body;

    if (!body || body.classList.contains("login-fit-page")) {
        return;
    }

    const pageName = window.location.pathname.split("/").pop() || "unknown-page";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "global-theme-toggle";
    toggle.setAttribute("aria-label", "Toggle theme");
    toggle.innerHTML = `
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"></path>
        </svg>
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
        </svg>
    `;
    document.body.appendChild(toggle);

    const logThemeChange = async (mode) => {
        const payload = {
            mode,
            page: pageName,
            changedAt: new Date().toISOString()
        };

        console.info(`[Theme Toggle] ${mode.toUpperCase()} on ${pageName}`, payload.changedAt);

        try {
            await fetch(`${API}/auth/theme-log`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn("Theme log API failed:", error);
        }
    };

    const applyTheme = (themeMode) => {
        const isLight = themeMode === "light";
        body.classList.toggle("theme-light", isLight);
        toggle.classList.toggle("is-light", isLight);
        toggle.setAttribute("aria-label", isLight ? "Light mode active" : "Dark mode active");
        toggle.setAttribute("title", isLight ? "Light mode active" : "Dark mode active");
    };

    const syncThemeFromStorage = () => {
        const storedTheme = localStorage.getItem(APP_THEME_KEY) || "dark";
        applyTheme(storedTheme);
    };

    syncThemeFromStorage();

    toggle.addEventListener("click", () => {
        const current = localStorage.getItem(APP_THEME_KEY) || "dark";
        const next = current === "light" ? "dark" : "light";
        localStorage.setItem(APP_THEME_KEY, next);
        applyTheme(next);
        logThemeChange(next);
        window.dispatchEvent(new CustomEvent("app-theme-change", { detail: { mode: next } }));
    });

    window.addEventListener("storage", (event) => {
        if (event.key !== APP_THEME_KEY) {
            return;
        }
        syncThemeFromStorage();
    });

    window.addEventListener("app-theme-change", (event) => {
        const mode = event.detail?.mode || "dark";
        applyTheme(mode);
    });
}

initializeFormOptions();
enhanceSelects();
initializePasswordToggles();
initializeAuthStorySliders();
initializeLoginThemeToggle();
initializeGlobalThemeToggle();

function roleLoginPath(role) {
    if (role === "student") {
        return STUDENT_LOGIN_ROUTE;
    }

    if (role === "company") {
        return COMPANY_LOGIN_ROUTE;
    }

    return "admin-login.html";
}

function guardRolePage(expectedRole) {
    const path = window.location.pathname.split("/").pop();
    const protectedPages = {
        "student.html": "student",
        "student-edit.html": "student",
        "company.html": "company",
        "company-job.html": "company",
        "company-edit.html": "company",
        "admin.html": "admin"
    };

    if (protectedPages[path] !== expectedRole) {
        return;
    }

    if (!getToken() || getRole() !== expectedRole) {
        window.location = roleLoginPath(expectedRole);
    }
}

guardRolePage("student");
guardRolePage("company");
guardRolePage("admin");

async function handleLogin(event, endpoint, redirectPage, role) {
    event.preventDefault();
    setError("");

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
        setError(data.message || "Login failed");
        return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);
    window.location = redirectPage;
}

const unifiedLoginModes = {
    student: {
        role: "student",
        title: "Student Login",
        intro: "Use your student username and password to enter the student dashboard.",
        usernamePlaceholder: "Enter student username",
        submitLabel: "Login as Student",
        signupPrefix: "New here?",
        signupLinkText: "Create a student account",
        signupLinkHref: "student-signup.html",
        forgotLinkHref: "student-forgot.html",
        storyTag: "Student workspace",
        storyTitle: "Step into a placement dashboard built around your profile.",
        storyText:
            "Sign in to manage your academic details, programming skills, backlog history, and job applications through a dedicated student-only portal.",
        slides: [
            {
                title: "Profile-driven eligibility",
                text: "Your branch, CGPA, year, and backlogs shape what companies appear."
            },
            {
                title: "Edit profile anytime",
                text: "Keep languages, contact details, and academic records updated for better matching."
            },
            {
                title: "Separate student access",
                text: "Student credentials stay isolated from company and admin routes."
            }
        ],
        endpoint: "/auth/login/student",
        redirectPage: "student.html"
    },
    company: {
        role: "company",
        title: "Company Login",
        intro: "Use your company account to open the recruitment dashboard.",
        usernamePlaceholder: "Enter company username",
        submitLabel: "Login as Company",
        signupPrefix: "Need a company account?",
        signupLinkText: "Create one here",
        signupLinkHref: "company-signup.html",
        forgotLinkHref: "company-forgot.html",
        storyTag: "Company workspace",
        storyTitle: "Hire through a dashboard designed for recruiters, not students.",
        storyText:
            "Sign in to manage job details, eligibility requirements, and applicant filtering through a company-only workspace.",
        slides: [
            {
                title: "Structured hiring filters",
                text: "Filter applicants by branch, year, CGPA, languages, and backlog history."
            },
            {
                title: "Rich job criteria",
                text: "Define job title, location, min CGPA, max backlogs, and required skills."
            },
            {
                title: "Separate company access",
                text: "Company credentials stay isolated from student and admin login flows."
            }
        ],
        endpoint: "/auth/login/company",
        redirectPage: "company.html"
    }
};

function initializeUnifiedLoginForm() {
    const page = document.querySelector("[data-unified-login]");
    const form = document.getElementById("unifiedLoginForm");

    if (!page || !form) {
        return;
    }

    const roleButtons = Array.from(page.querySelectorAll("[data-role-value]"));
    const storyTag = page.querySelector("[data-role-story-tag]");
    const storyTitle = page.querySelector("[data-role-story-title]");
    const storyText = page.querySelector("[data-role-story-text]");
    const loginTitle = page.querySelector("[data-role-login-title]");
    const loginIntro = page.querySelector("[data-role-login-intro]");
    const usernameInput = page.querySelector("[data-role-username-placeholder]");
    const loginButton = page.querySelector("[data-role-login-button]");
    const signupPrefix = page.querySelector("[data-role-signup-prefix]");
    const signupLink = page.querySelector("[data-role-signup-link]");
    const forgotLink = page.querySelector("[data-role-forgot-link]");

    let activeRole = "student";

    const applyRole = (rawRole, syncUrl = true) => {
        const role = rawRole === "company" ? "company" : "student";
        const mode = unifiedLoginModes[role];

        activeRole = role;

        roleButtons.forEach((button) => {
            const isActive = button.dataset.roleValue === role;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });

        if (storyTag) storyTag.textContent = mode.storyTag;
        if (storyTitle) storyTitle.textContent = mode.storyTitle;
        if (storyText) storyText.textContent = mode.storyText;
        if (loginTitle) loginTitle.textContent = mode.title;
        if (loginIntro) loginIntro.textContent = mode.intro;
        if (usernameInput) usernameInput.placeholder = mode.usernamePlaceholder;
        if (loginButton) loginButton.textContent = mode.submitLabel;
        if (signupPrefix) signupPrefix.textContent = mode.signupPrefix;
        if (signupLink) {
            signupLink.textContent = mode.signupLinkText;
            signupLink.setAttribute("href", mode.signupLinkHref);
        }
        if (forgotLink) {
            forgotLink.setAttribute("href", mode.forgotLinkHref);
        }

        mode.slides.forEach((slide, index) => {
            const titleNode = page.querySelector(`[data-role-slide-title="${index}"]`);
            const textNode = page.querySelector(`[data-role-slide-text="${index}"]`);
            if (titleNode) titleNode.textContent = slide.title;
            if (textNode) textNode.textContent = slide.text;
        });

        document.title = mode.title;

        if (syncUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set("role", role);
            window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }

        // Recompute slider card height after copy changes.
        window.dispatchEvent(new Event("resize"));
    };

    roleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyRole(button.dataset.roleValue || "student");
        });
    });

    form.addEventListener("submit", (event) => {
        const mode = unifiedLoginModes[activeRole] || unifiedLoginModes.student;
        handleLogin(event, mode.endpoint, mode.redirectPage, mode.role);
    });

    const initialRole = new URLSearchParams(window.location.search).get("role");
    applyRole(initialRole, false);
}

initializeUnifiedLoginForm();

const studentLoginForm = document.getElementById("studentLoginForm");
if (studentLoginForm) {
    studentLoginForm.addEventListener("submit", (event) => {
        handleLogin(event, "/auth/login/student", "student.html", "student");
    });
}

const companyLoginForm = document.getElementById("companyLoginForm");
if (companyLoginForm) {
    companyLoginForm.addEventListener("submit", (event) => {
        handleLogin(event, "/auth/login/company", "company.html", "company");
    });
}

const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (event) => {
        handleLogin(event, "/auth/login/admin", "admin.html", "admin");
    });
}

async function signup(event) {
    event.preventDefault();
    setError("");

    const payload = {
        username: document.getElementById("su_username").value,
        password: document.getElementById("su_password").value,
        rollNumber: document.getElementById("rollNumber").value,
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        branch: getBranchValue("branch", "customBranch"),
        yearOfStudy: document.getElementById("yearOfStudy").value,
        cgpa: document.getElementById("cgpa").value,
        currentBacklogs: document.getElementById("currentBacklogs").value,
        pastBacklogs: document.getElementById("pastBacklogs").value,
        programmingLanguages: getLanguageValues("studentLanguages", "customStudentLanguages"),
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value
    };

    if (!payload.branch) {
        setError("Please select your branch or type a custom branch.");
        return;
    }

    const response = await fetch(`${API}/auth/signup/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        setError(data.message || "Student signup failed");
        return;
    }

    await customAlert("Student signup successful. Please login.", "Success");
    window.location = STUDENT_LOGIN_ROUTE;
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", signup);
}

async function companySignup(event) {
    event.preventDefault();
    setError("");

    const payload = {
        username: document.getElementById("su_username").value,
        password: document.getElementById("su_password").value,
        companyName: document.getElementById("companyName").value,
        email: document.getElementById("companyEmail").value
    };

    const response = await fetch(`${API}/auth/signup/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        setError(data.message || "Company signup failed");
        return;
    }

    await customAlert("Company signup successful. Please login.", "Success");
    window.location = COMPANY_LOGIN_ROUTE;
}

const companySignupForm = document.getElementById("companySignupForm");
if (companySignupForm) {
    companySignupForm.addEventListener("submit", companySignup);
}

async function handleForgotPassword(event, endpoint, payloadBuilder, redirectPage) {
    event.preventDefault();
    setError("");

    try {
        const response = await fetch(`${API}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBuilder())
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "Password reset failed");
            return;
        }

        await customAlert(data.message, "Success");
        window.location = redirectPage;
    } catch (error) {
        console.error("Forgot-password error:", error);
        setError("Network error while resetting password");
    }
}

async function sendForgotOtp(endpoint, payloadBuilder, rolePrefix) {
    setError("");
    try {
        const response = await fetch(`${API}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBuilder())
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "Could not send OTP");
            return;
        }

        await customAlert(data.message || "OTP sent successfully.", "Verification Code Sent");
        
        // Hide stage 1 (username/email) and show stage 2 (OTP input)
        const stage1 = document.getElementById(`${rolePrefix}Stage1`);
        const stage2 = document.getElementById(`${rolePrefix}Stage2`);
        if (stage1) stage1.style.display = "none";
        if (stage2) {
            stage2.style.display = "block";
            stage2.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } catch (error) {
        console.error("Send OTP error:", error);
        setError("Network error while sending OTP");
    }
}

async function verifyOtp(endpoint, payloadBuilder, rolePrefix) {
    setError("");
    try {
        const response = await fetch(`${API}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBuilder())
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "OTP verification failed");
            return;
        }

        await customAlert(data.message || "OTP verified successfully.", "Verified");
        
        // Hide stage 2 (OTP) and show stage 3 (new password)
        const stage2 = document.getElementById(`${rolePrefix}Stage2`);
        const stage3 = document.getElementById(`${rolePrefix}Stage3`);
        if (stage2) stage2.style.display = "none";
        if (stage3) {
            stage3.style.display = "block";
            stage3.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } catch (error) {
        console.error("Verify OTP error:", error);
        setError("Network error while verifying OTP");
    }
}

function resetStudentFlow() {
    // Hide stage 2 and show stage 1
    const stage1 = document.getElementById("studentStage1");
    const stage2 = document.getElementById("studentStage2");
    if (stage2) stage2.style.display = "none";
    if (stage1) {
        stage1.style.display = "block";
        stage1.scrollIntoView({ behavior: "smooth", block: "center" });
        // Clear inputs
        document.getElementById("username").value = "";
        document.getElementById("studentEmail").value = "";
        document.getElementById("studentOtpCode").value = "";
    }
    setError("");
}

function resetCompanyFlow() {
    // Hide stage 2 and show stage 1
    const stage1 = document.getElementById("companyStage1");
    const stage2 = document.getElementById("companyStage2");
    if (stage2) stage2.style.display = "none";
    if (stage1) {
        stage1.style.display = "block";
        stage1.scrollIntoView({ behavior: "smooth", block: "center" });
        // Clear inputs
        document.getElementById("username").value = "";
        document.getElementById("companyEmail").value = "";
        document.getElementById("companyOtpCode").value = "";
    }
    setError("");
}

const studentForgotForm = document.getElementById("studentForgotForm");
const studentSendOtpBtn = document.getElementById("studentSendOtpBtn");
const studentVerifyOtpBtn = document.getElementById("studentVerifyOtpBtn");

if (studentSendOtpBtn) {
    studentSendOtpBtn.addEventListener("click", () =>
        sendForgotOtp("/auth/forgot-password/student/send-otp", () => ({
            username: document.getElementById("username").value,
            email: document.getElementById("studentEmail").value
        }), "student")
    );
}

if (studentVerifyOtpBtn) {
    studentVerifyOtpBtn.addEventListener("click", () =>
        verifyOtp("/auth/forgot-password/student/verify-otp", () => ({
            username: document.getElementById("username").value,
            email: document.getElementById("studentEmail").value,
            otpCode: document.getElementById("studentOtpCode").value
        }), "student")
    );
}

if (studentForgotForm) {
    studentForgotForm.addEventListener("submit", (event) =>
        handleForgotPassword(
            event,
            "/auth/forgot-password/student/verify-otp",
            () => ({
                username: document.getElementById("username").value,
                email: document.getElementById("studentEmail").value,
                otpCode: document.getElementById("studentOtpCode").value,
                newPassword: document.getElementById("newPassword").value
            }),
            STUDENT_LOGIN_ROUTE
        )
    );
}

const companyForgotForm = document.getElementById("companyForgotForm");
const companySendOtpBtn = document.getElementById("companySendOtpBtn");
const companyVerifyOtpBtn = document.getElementById("companyVerifyOtpBtn");

if (companySendOtpBtn) {
    companySendOtpBtn.addEventListener("click", () =>
        sendForgotOtp("/auth/forgot-password/company/send-otp", () => ({
            username: document.getElementById("username").value,
            email: document.getElementById("companyEmail").value
        }), "company")
    );
}

if (companyVerifyOtpBtn) {
    companyVerifyOtpBtn.addEventListener("click", () =>
        verifyOtp("/auth/forgot-password/company/verify-otp", () => ({
            username: document.getElementById("username").value,
            email: document.getElementById("companyEmail").value,
            otpCode: document.getElementById("companyOtpCode").value
        }), "company")
    );
}

if (companyForgotForm) {
    companyForgotForm.addEventListener("submit", (event) =>
        handleForgotPassword(
            event,
            "/auth/forgot-password/company/verify-otp",
            () => ({
                username: document.getElementById("username").value,
                email: document.getElementById("companyEmail").value,
                otpCode: document.getElementById("companyOtpCode").value,
                newPassword: document.getElementById("newPassword").value
            }),
            COMPANY_LOGIN_ROUTE
        )
    );
}

const adminForgotForm = document.getElementById("adminForgotForm");
if (adminForgotForm) {
    adminForgotForm.addEventListener("submit", (event) =>
        handleForgotPassword(
            event,
            "/auth/forgot-password/admin",
            () => ({
                username: document.getElementById("username").value,
                resetKey: document.getElementById("resetKey").value,
                newPassword: document.getElementById("newPassword").value
            }),
            "admin-login.html"
        )
    );
}

const landingModes = {
    student: {
        entryTag: "Student Access",
        entryTitle: "Continue as a student",
        entryText: "Sign in to view eligible roles, maintain your profile, and manage applications.",
        entryLoginHref: "student-login.html",
        entrySignupHref: "student-signup.html",
        heroTag: "Career readiness meets structured recruitment",
        heroTitle: "One polished portal for students ready to get placed.",
        heroText:
            "Build a strong profile, discover eligible opportunities, and move through the application flow with a student experience designed around clarity.",
        heroLoginText: "Student Login",
        heroSignupText: "Student Sign Up",
        heroLoginHref: "student-login.html",
        heroSignupHref: "student-signup.html",
        metricLabel1: "Profile depth",
        metricValue1: "Skills + academics",
        metricDesc1: "Showcase your full academic portfolio. Enter specific details like branch, CGPA, programming languages, and backlog history to build a complete profile that grabs recruiters' attention.",
        metricLabel2: "Matching",
        metricValue2: "Eligibility-based roles",
        metricDesc2: "Stop manually searching for jobs you aren't eligible for. Discover roles matched precisely to your academic standing and skill set, saving time and effort.",
        metricLabel3: "Momentum",
        metricValue3: "Track applications smoothly",
        metricDesc3: "Follow through effortlessly. View application statuses, manage interviews, and track your placements efficiently directly from your dashboard.",
        workspaceTag: "Choose your workspace",
        workspaceTitle: "Student journeys built for profile growth and opportunity discovery.",
        workspaceText:
            "Keep your profile updated, filter through relevant companies, and stay focused on the roles that align with your academic record and skill set.",
        card1Href: "student-login.html",
        card1Title: "Student login",
        card1Text: "Open your dashboard, manage profile strength, and explore matching jobs.",
        card2Href: "student-signup.html",
        card2Title: "Create student account",
        card2Text: "Register with your branch, year, CGPA, backlog history, and programming skills.",
        featureLabel1: "Student profiles",
        featureValue1: "Branch, year, languages, backlog history",
        featureLabel2: "Workflow design",
        featureValue2: "Dedicated actions for login, signup, and filtering",
        featureLabel3: "Experience",
        featureValue3: "Focused, role-based landing flow"
    },
    company: {
        entryTag: "Company Access",
        entryTitle: "Continue as a recruiter",
        entryText: "Sign in to define job requirements, filter applicants, and manage hiring decisions.",
        entryLoginHref: COMPANY_LOGIN_ROUTE,
        entrySignupHref: "company-signup.html",
        heroTag: "Structured hiring for modern recruiters",
        heroTitle: "One polished portal for companies hiring with precision.",
        heroText:
            "Set job criteria, shortlist the right applicants faster, and manage company-side recruitment with a workflow built around clarity and control.",
        heroLoginText: "Company Login",
        heroSignupText: "Company Sign Up",
        heroLoginHref: COMPANY_LOGIN_ROUTE,
        heroSignupHref: "company-signup.html",
        metricLabel1: "Requirement design",
        metricValue1: "CGPA, backlog, branch filters",
        metricDesc1: "Define precise constraints for roles. Automatically filter out candidates who don't meet strict branch, CGPA, graduation year, or backlog requirements to optimize the shortlist.",
        metricLabel2: "Applicant review",
        metricValue2: "Sort by year, skill, and strength",
        metricDesc2: "Spend less time reviewing unsuitable candidates. Browse qualified applicant pools sorted rigorously by academic strength, relevant programming skills, and year.",
        metricLabel3: "Decision flow",
        metricValue3: "Shortlist and reject cleanly",
        metricDesc3: "Keep candidates informed and your team aligned. Swiftly manage pipelines, move promising students forward, or reject cleanly right from the company panel.",
        workspaceTag: "Choose your workspace",
        workspaceTitle: "Company journeys focused on hiring criteria and applicant review.",
        workspaceText:
            "Define role expectations, review student profiles against your hiring rules, and use the company dashboard to move applications forward with confidence.",
        card1Href: COMPANY_LOGIN_ROUTE,
        card1Title: "Company login",
        card1Text: "Open the recruiter dashboard and manage requirements, applicants, and hiring decisions.",
        card2Href: "company-signup.html",
        card2Title: "Create company account",
        card2Text: "Register your company, add job details, and publish eligibility requirements in one flow.",
        featureLabel1: "Company requirements",
        featureValue1: "Job details, min CGPA, max backlogs, languages",
        featureLabel2: "Recruiter workflow",
        featureValue2: "Dedicated actions for hiring and applicant review",
        featureLabel3: "Experience",
        featureValue3: "Focused, role-based landing flow"
    }
};

function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) {
        node.textContent = value;
    }
}

function setHref(selector, value) {
    const node = document.querySelector(selector);
    if (node) {
        node.setAttribute("href", value);
    }
}

function swapLandingMode(mode) {
    const content = landingModes[mode];

    if (!content) {
        return;
    }

    const animatedSections = document.querySelectorAll(".landing-stage");
    animatedSections.forEach((section) => section.classList.add("is-switching"));

    window.setTimeout(() => {
        setText("[data-entry-tag]", content.entryTag);
        setText("[data-entry-title]", content.entryTitle);
        setText("[data-entry-text]", content.entryText);
        setHref("[data-entry-login]", content.entryLoginHref);
        setHref("[data-entry-signup]", content.entrySignupHref);

        setText("[data-hero-tag]", content.heroTag);
        setText("[data-hero-title]", content.heroTitle);
        setText("[data-hero-text]", content.heroText);
        setText("[data-hero-login]", content.heroLoginText);
        setText("[data-hero-signup]", content.heroSignupText);
        setHref("[data-hero-login]", content.heroLoginHref);
        setHref("[data-hero-signup]", content.heroSignupHref);

        setText("[data-metric-label-1]", content.metricLabel1);
        setText("[data-metric-value-1]", content.metricValue1);
        setText("[data-metric-desc-1]", content.metricDesc1);
        setText("[data-metric-label-2]", content.metricLabel2);
        setText("[data-metric-value-2]", content.metricValue2);
        setText("[data-metric-desc-2]", content.metricDesc2);
        setText("[data-metric-label-3]", content.metricLabel3);
        setText("[data-metric-value-3]", content.metricValue3);
        setText("[data-metric-desc-3]", content.metricDesc3);

        setText("[data-workspace-tag]", content.workspaceTag);
        setText("[data-workspace-title]", content.workspaceTitle);
        setText("[data-workspace-text]", content.workspaceText);
        setHref("#workspaceCards .role-card:nth-child(1)", content.card1Href);
        setText("[data-card-title-1]", content.card1Title);
        setText("[data-card-text-1]", content.card1Text);
        setHref("#workspaceCards .role-card:nth-child(2)", content.card2Href);
        setText("[data-card-title-2]", content.card2Title);
        setText("[data-card-text-2]", content.card2Text);

        setText("[data-feature-label-1]", content.featureLabel1);
        setText("[data-feature-value-1]", content.featureValue1);
        setText("[data-feature-label-2]", content.featureLabel2);
        setText("[data-feature-value-2]", content.featureValue2);
        setText("[data-feature-label-3]", content.featureLabel3);
        setText("[data-feature-value-3]", content.featureValue3);

        animatedSections.forEach((section) => section.classList.remove("is-switching"));
        window.dispatchEvent(new Event("resize"));
    }, 170);
}

const entryTabs = document.querySelectorAll(".entry-tab");
const entrySwitch = document.querySelector(".entry-switch");

if (entryTabs.length) {
    entryTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.target;

            entryTabs.forEach((item) => {
                const isActive = item === tab;
                item.classList.toggle("active", isActive);
                item.setAttribute("aria-selected", String(isActive));
            });

            if (entrySwitch) {
                entrySwitch.classList.toggle("company-active", target === "company");
            }

            swapLandingMode(target);
        });
    });
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location = "index.html";
}

async function authorizedFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        const role = getRole();
        await customAlert("Your session is not valid for this page. Please login again.", "Session Expired");
        logout();
        if (role) {
            window.location = roleLoginPath(role);
        }
        throw new Error("Unauthorized");
    }

    return response;
}

function renderTable(html) {
    const output = document.getElementById("output");
    output.classList.remove("card-mode");
    output.innerHTML = `<div class="table-wrap">${html}</div>`;
}

function renderCard(html) {
    const output = document.getElementById("output");
    output.classList.add("card-mode");
    output.innerHTML = html;
}

function listText(values, emptyText) {
    return values && values.length ? values.join(", ") : emptyText;
}

function buildStudentSummary(student, showEditAction = false) {
    return `
        <div class="card-box">
            <h2>${student.firstName} ${student.lastName}</h2>
            <p class="info-line">
                ${student.branch} branch, year ${student.yearOfStudy}, CGPA ${student.cgpa}
            </p>
            <div class="metrics-grid" style="margin-top:18px;">
                <div class="metric-card">
                    <span>Current backlogs</span>
                    <strong>${student.currentBacklogs}</strong>
                </div>
                <div class="metric-card">
                    <span>Past backlogs</span>
                    <strong>${student.pastBacklogs}</strong>
                </div>
                <div class="metric-card">
                    <span>Languages</span>
                    <strong>${student.programmingLanguages.length || 0}</strong>
                </div>
            </div>
            <p class="info-line"><strong>Languages:</strong> ${listText(student.programmingLanguages, "Not added yet")}</p>
            <p class="info-line"><strong>Email:</strong> ${student.email || "-"}</p>
            <p class="info-line"><strong>Phone:</strong> ${student.phone || "-"}</p>
            <p class="info-line"><strong>Address:</strong> ${student.address || "-"}</p>
            ${showEditAction ? `
                <div class="form-actions" style="margin-top:16px;">
                    <a href="student-edit.html" class="btn btn-primary">Edit Profile</a>
                </div>
            ` : ""}
        </div>
    `;
}

function setStudentDashboardMode(mode) {
    const path = window.location.pathname.split("/").pop();
    if (path !== "student.html") {
        return;
    }

    const header = document.querySelector(".workspace-header");
    const metrics = document.querySelector(".metrics-grid");
    const filterBox = document.getElementById("studentFilterBox");
    const filterActions = document.getElementById("studentFilterActions");

    if (!header || !metrics || !filterBox) {
        return;
    }

    const showFilters = mode === "jobs";

    header.style.display = "";
    metrics.style.display = mode === "profile" ? "none" : "";
    filterBox.style.display = showFilters ? "grid" : "none";
    if (filterActions) {
        filterActions.style.display = showFilters ? "flex" : "none";
    }
}

async function loadStudentHome() {
    setStudentDashboardMode("overview");
    const response = await authorizedFetch(`${API}/student/profile`);
    const student = await response.json();
    renderCard(buildStudentSummary(student, false));
}

async function loadProfile() {
    setStudentDashboardMode("profile");
    const response = await authorizedFetch(`${API}/student/profile`);
    const student = await response.json();
    renderCard(buildStudentSummary(student, true));
}

async function loadEligibleJobs() {
    setStudentDashboardMode("jobs");
    const params = new URLSearchParams();
    const fieldMap = {
        companyName: "filterCompanyName",
        jobTitle: "filterJobTitle",
        location: "filterLocation",
        employmentType: "filterEmploymentType",
        maxMinCgpa: "filterCgpa",
        maxBacklogsAllowed: "filterBacklogs",
        language: "filterLanguage",
        branch: "filterEligibleBranch",
        year: "filterEligibleYear",
        sort: "sortOption"
    };

    Object.entries(fieldMap).forEach(([param, elementId]) => {
        const value = document.getElementById(elementId)?.value;
        if (value) params.set(param, value);
    });

    const query = params.toString();
    const response = await authorizedFetch(`${API}/student/eligible-jobs${query ? `?${query}` : ""}`);
    const jobs = await response.json();

    let html = `
        <table>
            <tr>
                <th>Company</th>
                <th>Job</th>
                <th>Location</th>
                <th>Type</th>
                <th>Min CGPA</th>
                <th>Max Backlogs</th>
                <th>Eligible Branches</th>
                <th>Eligible Years</th>
                <th>Required Languages</th>
                <th>Action</th>
            </tr>
    `;

    if (jobs.length === 0) {
        html += `<tr><td colspan="10">No matching jobs found</td></tr>`;
    } else {
        jobs.forEach((job) => {
            html += `
                <tr>
                    <td>${job.company ? job.company.companyName : "Unknown"}</td>
                    <td>${job.jobTitle}</td>
                    <td>${job.jobLocation || "-"}</td>
                    <td>${job.employmentType || "-"}</td>
                    <td>${job.minCgpa}</td>
                    <td>${job.maxBacklogs}</td>
                    <td>${listText(job.eligibleBranches, "All branches")}</td>
                    <td>${listText(job.eligibleYears, "All years")}</td>
                    <td>${listText(job.requiredLanguages, "Not specified")}</td>
                    <td><button class="btn btn-primary" onclick="applyJob('${job._id}')">Apply</button></td>
                </tr>
                <tr>
                    <td colspan="10"><strong>Description:</strong> ${job.jobDescription || "-"}</td>
                </tr>
            `;
        });
    }

    html += "</table>";
    renderTable(html);
}

const loadCompanies = loadEligibleJobs;

async function applyJob(jobId) {
    const resumeLink = await customPrompt("Enter resume link", "https://example.com/resume", "Submit Resume");
    if (resumeLink === null) return;
    
    const coverLetter = await customPrompt("Enter a short cover letter", "Interested in this opportunity.", "Cover Letter");
    if (coverLetter === null) return;

    const response = await authorizedFetch(`${API}/student/apply/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeLink, coverLetter })
    });

    const data = await response.json();
    await customAlert(data.message, "Application Status");
}

const applyCompany = applyJob;

async function populateStudentEditForm() {
    const response = await authorizedFetch(`${API}/student/profile`);
    const student = await response.json();

    document.getElementById("editFirstName").value = student.firstName || "";
    document.getElementById("editLastName").value = student.lastName || "";
    setSelectOrCustomBranch("editBranch", "editBranchCustomField", "editCustomBranch", student.branch || "");
    document.getElementById("editYearOfStudy").value = student.yearOfStudy || "";
    document.getElementById("editCgpa").value = student.cgpa || "";
    document.getElementById("editCurrentBacklogs").value = student.currentBacklogs || 0;
    document.getElementById("editPastBacklogs").value = student.pastBacklogs || 0;
    const savedLanguages = Array.isArray(student.programmingLanguages) ? student.programmingLanguages : [];
    setChoiceValues("editStudentLanguages", savedLanguages);
    const customEditLanguages = savedLanguages.filter(
        (language) => !LANGUAGE_OPTIONS.some((option) => option.toLowerCase() === String(language).toLowerCase())
    );
    const editCustomLanguagesInput = document.getElementById("editCustomStudentLanguages");
    if (editCustomLanguagesInput) {
        editCustomLanguagesInput.value = customEditLanguages.join(", ");
    }
    document.getElementById("editEmail").value = student.email || "";
    document.getElementById("editPhone").value = student.phone || "";
    document.getElementById("editAddress").value = student.address || "";
}

const studentEditForm = document.getElementById("studentEditForm");
if (studentEditForm) {
    studentEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setError("");

        const payload = {
            firstName: document.getElementById("editFirstName").value,
            lastName: document.getElementById("editLastName").value,
            branch: getBranchValue("editBranch", "editCustomBranch"),
            yearOfStudy: document.getElementById("editYearOfStudy").value,
            cgpa: document.getElementById("editCgpa").value,
            currentBacklogs: document.getElementById("editCurrentBacklogs").value,
            pastBacklogs: document.getElementById("editPastBacklogs").value,
            programmingLanguages: getLanguageValues("editStudentLanguages", "editCustomStudentLanguages"),
            email: document.getElementById("editEmail").value,
            phone: document.getElementById("editPhone").value,
            address: document.getElementById("editAddress").value
        };

        if (!payload.branch) {
            setError("Please select your branch or type a custom branch.");
            return;
        }

        const response = await authorizedFetch(`${API}/student/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "Could not update profile");
            return;
        }

        await customAlert(data.message, "Profile Updated");
        window.location = "student.html";
    });
}

async function editCompanyName() {
    const response = await authorizedFetch(`${API}/company/profile`);
    const company = await response.json();

    const newName = await customPrompt("Enter new company name", company.companyName, "Update Profile");
    if (newName && newName.trim() !== "") {
        const updateRes = await authorizedFetch(`${API}/company/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName: newName })
        });
        const data = await updateRes.json();
        if (updateRes.ok) {
            await customAlert("Company profile updated.", "Success");
            loadCompanyHome();
        } else {
            await customAlert(data.message, "Error");
        }
    }
}

async function loadCompanyHome() {
    document.getElementById("applicantFilters").style.display = "none";
    const filterActions = document.getElementById("applicantFilterActions");
    if (filterActions) {
        filterActions.style.display = "none";
    }
    const response = await authorizedFetch(`${API}/company/profile`);
    const company = await response.json();
    const sidebarTag = document.getElementById("companyNameSidebar");
    if (sidebarTag) sidebarTag.innerText = company.companyName;

    renderCard(`
        <div class="card-box">
            <h2>Welcome, ${company.companyName}</h2>
            <p class="info-line">Manage your jobs and review applicants from this dashboard.</p>
        </div>
    `);
}

async function loadCompanyJobs() {
    document.getElementById("applicantFilters").style.display = "none";
    const filterActions = document.getElementById("applicantFilterActions");
    if (filterActions) {
        filterActions.style.display = "none";
    }
    const response = await authorizedFetch(`${API}/company/jobs`);
    const jobs = await response.json();

    let html = `
        <table>
            <tr>
                <th>Job Title</th>
                <th>Location</th>
                <th>Type</th>
                <th>Min CGPA</th>
                <th>Max Backlogs</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
    `;

    if (jobs.length === 0) {
        html += `<tr><td colspan="7">No jobs posted yet.</td></tr>`;
    } else {
        jobs.forEach(job => {
            const statusToggleTxt = job.isActive ? "Close Job" : "Re-open Job";
            const statusClass = job.isActive ? "shortlisted" : "rejected";
            const statusText = job.isActive ? "Active" : "Closed";

            html += `
                <tr>
                    <td><strong>${job.jobTitle}</strong></td>
                    <td>${job.jobLocation || "-"}</td>
                    <td>${job.employmentType || "-"}</td>
                    <td>${job.minCgpa}</td>
                    <td>${job.maxBacklogs}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="table-actions">
                            <a href="company-job.html?id=${job._id}" class="btn btn-primary" style="padding:6px 14px; font-size:0.85rem; text-decoration:none;">Edit</a>
                            <button class="btn btn-secondary" onclick="toggleJobActive('${job._id}', ${!job.isActive})">${statusToggleTxt}</button>
                            <button class="reject-btn" onclick="deleteJob('${job._id}', this)">Delete</button>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td colspan="7">
                        <strong>Branches:</strong> ${listText(job.eligibleBranches, "All")} | 
                        <strong>Years:</strong> ${listText(job.eligibleYears, "All")} | 
                        <strong>Languages:</strong> ${listText(job.requiredLanguages, "None")} <br />
                        <strong>Description:</strong> ${job.jobDescription || "-"}
                    </td>
                </tr>
            `;
        });
    }

    html += "</table>";
    renderTable(html);
}

async function toggleJobActive(jobId, isActive) {
    const res = await authorizedFetch(`${API}/company/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
    });
    if (res.ok) loadCompanyJobs();
}

async function deleteJob(jobId, btn) {
    const confirmed = await customConfirm("Are you sure you want to delete this job and all its applications?", "Delete Job");
    if (confirmed) {
        const originalText = btn.innerText;
        btn.innerText = "Deleting...";
        btn.disabled = true;

        const res = await authorizedFetch(`${API}/company/jobs/${jobId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            loadCompanyJobs();
        } else {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

async function loadJobForm() {
    const form = document.getElementById("jobForm");
    if (!form) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get("id");
    
    if (jobId) {
        document.getElementById("modeTag").innerText = "Edit Job Role";
        document.getElementById("modeTitle").innerText = "Refine Your Job Posting";
        document.getElementById("saveJobBtn").innerText = "Save Changes";
        
        const res = await authorizedFetch(`${API}/company/jobs/${jobId}`);
        if (res.ok) {
            const job = await res.json();
            document.getElementById("jobTitle").value = job.jobTitle;
            document.getElementById("jobLocation").value = job.jobLocation || "";
            document.getElementById("employmentType").value = job.employmentType || "";
            document.getElementById("jobDescription").value = job.jobDescription || "";
            document.getElementById("minCgpa").value = job.minCgpa;
            document.getElementById("maxBacklogs").value = job.maxBacklogs;
            setChoiceValues("eligibleBranches", job.eligibleBranches);
            setChoiceValues("eligibleYears", (job.eligibleYears || []).map(String));
            setChoiceValues("requiredLanguages", job.requiredLanguages);
        } else {
            const data = await res.json();
            setError(data.message || "Could not load the selected job");
        }
    }
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setError("");

        const payload = {
            jobTitle: document.getElementById("jobTitle").value.trim(),
            jobLocation: document.getElementById("jobLocation").value.trim(),
            employmentType: document.getElementById("employmentType").value.trim(),
            jobDescription: document.getElementById("jobDescription").value.trim(),
            minCgpa: document.getElementById("minCgpa").value,
            maxBacklogs: document.getElementById("maxBacklogs").value,
            eligibleBranches: getChoiceValues("eligibleBranches"),
            eligibleYears: getChoiceValues("eligibleYears"),
            requiredLanguages: getChoiceValues("requiredLanguages")
        };
        
        const endpoint = jobId ? `/company/jobs/${jobId}` : `/company/jobs`;
        const method = jobId ? "PUT" : "POST";
        
        const saveRes = await authorizedFetch(`${API}${endpoint}`, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (saveRes.ok) {
            await customAlert(jobId ? "Job updated successfully!" : "Job created successfully!", "Success");
            window.location.href = "company.html";
        } else {
            const data = await saveRes.json();
            setError(data.message || "Failed to save job");
        }
    });
}

async function fetchCompanyJobsForFilters() {
    const response = await authorizedFetch(`${API}/company/jobs`);
    const jobs = await response.json();
    const select = document.getElementById("filterJobId");
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Jobs</option>';
        jobs.forEach(job => {
            select.innerHTML += `<option value="${job._id}">${job.jobTitle} (${job.isActive ? 'Active' : 'Closed'})</option>`;
        });
        select.value = currentValue;
    }
}

async function loadApplicants() {
    document.getElementById("applicantFilters").style.display = "grid";
    const filterActions = document.getElementById("applicantFilterActions");
    if (filterActions) {
        filterActions.style.display = "flex";
    }
    await fetchCompanyJobsForFilters();

    const params = new URLSearchParams();
    const fieldMap = {
        jobId: "filterJobId",
        branch: "filterStudentBranch",
        yearOfStudy: "filterStudentYear",
        language: "filterStudentLanguage",
        minCgpa: "filterStudentCgpa",
        maxCurrentBacklogs: "filterStudentCurrentBacklogs",
        maxPastBacklogs: "filterStudentPastBacklogs",
        status: "filterApplicationStatus",
        sort: "companySortOption"
    };

    Object.entries(fieldMap).forEach(([param, elementId]) => {
        const value = document.getElementById(elementId)?.value;
        if (value) params.set(param, value);
    });

    const query = params.toString();
    const response = await authorizedFetch(`${API}/company/applicants${query ? `?${query}` : ""}`);
    const applicants = await response.json();

    let html = `
        <table>
            <tr>
                <th>Job</th>
                <th>Applicant</th>
                <th>Roll</th>
                <th>Branch</th>
                <th>Year</th>
                <th>CGPA</th>
                <th>Backlogs (C/P)</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
    `;

    if (applicants.length === 0) {
        html += `<tr><td colspan="9">No applicants found</td></tr>`;
    } else {
        applicants.forEach((application) => {
            const student = application.student;
            html += `
                <tr>
                    <td><strong>${application.jobTitle}</strong></td>
                    <td>${student.firstName} ${student.lastName}</td>
                    <td>${student.rollNumber}</td>
                    <td>${student.branch}</td>
                    <td>${student.yearOfStudy}</td>
                    <td>${student.cgpa}</td>
                    <td>${student.currentBacklogs} / ${student.pastBacklogs}</td>
                    <td><span class="status ${application.status}">${application.status}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="shortlist-btn" onclick="updateStatus('${application.id}', 'shortlisted')">Shortlist</button>
                            <button class="reject-btn" onclick="updateStatus('${application.id}', 'rejected')">Reject</button>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td colspan="9">
                        <strong>Email:</strong> ${student.email || "-"} |
                        <strong>Phone:</strong> ${student.phone || "-"} |
                        <strong>Languages:</strong> ${listText(student.programmingLanguages, "-")} |
                        <strong>Resume:</strong> ${application.resumeLink || "-"} |
                        <strong>Cover Letter:</strong> ${application.coverLetter || "-"}
                    </td>
                </tr>
            `;
        });
    }

    html += "</table>";
    renderTable(html);
}

async function updateStatus(appId, status) {
    const response = await authorizedFetch(`${API}/company/application/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });

    if (response.ok) {
        loadApplicants();
    }
}

async function populateCompanyEditForm() {
    const response = await authorizedFetch(`${API}/company/profile`);
    const company = await response.json();

    document.getElementById("editCompanyName").value = company.companyName || "";
    const emailField = document.getElementById("editCompanyEmail");
    if (emailField) {
        emailField.value = company.email || "";
    }
}

const companyEditForm = document.getElementById("companyEditForm");
if (companyEditForm) {
    companyEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setError("");

        const payload = {
            companyName: document.getElementById("editCompanyName").value.trim(),
            email: document.getElementById("editCompanyEmail").value.trim()
        };

        const response = await authorizedFetch(`${API}/company/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message || "Could not update company profile");
            return;
        }

        await customAlert(data.message, "Profile Updated");
        window.location = "company.html";
    });
}

async function loadAdminHome() {
    const filterBox = document.getElementById("adminFilterBox");
    if (filterBox) filterBox.style.display = "none";
    
    renderCard(`
        <div class="card-box">
            <h2>Admin Control Center</h2>
            <p class="info-line">
                This dashboard is separate from student and company portals. Use the
                controls on the left to inspect users and applications across the system.
            </p>
            <div class="metrics-grid" style="margin-top:18px;">
                <div class="metric-card">
                    <span>Security</span>
                    <strong>Separate admin authentication</strong>
                </div>
                <div class="metric-card">
                    <span>Visibility</span>
                    <strong>Cross-role reporting</strong>
                </div>
                <div class="metric-card">
                    <span>Oversight</span>
                    <strong>Users and applications</strong>
                </div>
            </div>
        </div>
    `);
}

async function loadUsers() {
    const filterBox = document.getElementById("adminFilterBox");
    if (filterBox) filterBox.style.display = "grid";
    
    const response = await authorizedFetch(`${API}/admin/users`);
    const data = await response.json();

    const viewType = document.getElementById("adminUserType")?.value || "all";
    const studentBranchFilter = document.getElementById("adminStudentBranchFilter")?.value || "";
    const studentYearFilter = document.getElementById("adminStudentYearFilter")?.value || "";
    const companyBranchFilter = document.getElementById("adminCompanyBranchFilter")?.value || "";
    const companyYearFilter = document.getElementById("adminCompanyYearFilter")?.value || "";
    const companyLanguageFilter = document.getElementById("adminCompanyLanguageFilter")?.value || "";

    const students = data.students.filter((student) => {
        if (studentBranchFilter && student.branch !== studentBranchFilter) {
            return false;
        }

        if (studentYearFilter && Number(student.yearOfStudy) !== Number(studentYearFilter)) {
            return false;
        }

        return true;
    });

    const companies = data.companies.filter((company) => {
        if (companyBranchFilter && !(company.eligibleBranches || []).includes(companyBranchFilter)) {
            return false;
        }

        if (companyYearFilter && !(company.eligibleYears || []).includes(Number(companyYearFilter))) {
            return false;
        }

        if (companyLanguageFilter && !(company.requiredLanguages || []).includes(companyLanguageFilter)) {
            return false;
        }

        return true;
    });

    let html = `
        <div class="card-box" style="margin-bottom:18px;">
            <h2>Users Directory</h2>
            <p class="info-line">Students: ${students.length} | Companies: ${companies.length}</p>
        </div>
    `;

    if (viewType === "all" || viewType === "students") {
        html += `
            <div class="card-box" style="margin-bottom:18px;">
                <h3>Students</h3>
                <p class="info-line">Student records filtered separately from company records.</p>
            </div>
            <div class="table-wrap">
                <table>
                    <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Year</th>
                        <th>CGPA</th>
                        <th>Languages</th>
                        <th>Actions</th>
                    </tr>
        `;

        if (students.length === 0) {
            html += `<tr><td colspan="7">No students found for the selected filters</td></tr>`;
        } else {
            students.forEach((student) => {
                html += `
                    <tr>
                        <td>${student.username}</td>
                        <td>${student.firstName} ${student.lastName}</td>
                        <td>${student.branch}</td>
                        <td>${student.yearOfStudy}</td>
                        <td>${student.cgpa}</td>
                        <td>${listText(student.programmingLanguages, "-")}</td>
                        <td>
                            <button class="reject-btn" onclick="deleteStudent('${student._id}', '${student.firstName} ${student.lastName}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</table></div>`;
    }

    if (viewType === "all" || viewType === "companies") {
        html += `
            <div class="card-box" style="margin:18px 0;">
                <h3>Companies</h3>
                <p class="info-line">Company records are shown in a separate filtered section.</p>
            </div>
            <div class="table-wrap">
                <table>
                    <tr>
                        <th>Username</th>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Min CGPA</th>
                        <th>Eligible Branches</th>
                        <th>Eligible Years</th>
                        <th>Required Languages</th>
                        <th>Actions</th>
                    </tr>
        `;

        if (companies.length === 0) {
            html += `<tr><td colspan="8">No companies found for the selected filters</td></tr>`;
        } else {
            companies.forEach((company) => {
                html += `
                    <tr>
                        <td>${company.username}</td>
                        <td>${company.companyName}</td>
                        <td>${company.jobTitle}</td>
                        <td>${company.minCgpa}</td>
                        <td>${listText(company.eligibleBranches, "All")}</td>
                        <td>${listText(company.eligibleYears, "All")}</td>
                        <td>${listText(company.requiredLanguages, "-")}</td>
                        <td>
                            <button class="reject-btn" onclick="deleteCompany('${company._id}', '${company.companyName}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</table></div>`;
    }

    renderCard(html);
}

async function deleteStudent(studentId, studentName) {
    const confirmed = await customConfirm(
        `Delete student "${studentName}"? This will also remove their applications.`, "Delete Student"
    );

    if (!confirmed) {
        return;
    }

    const btnRows = Array.from(document.querySelectorAll('.reject-btn'));
    const targetBtn = btnRows.find(btn => btn.getAttribute('onclick').includes(studentId));
    if (targetBtn) {
        targetBtn.textContent = "Deleting...";
        targetBtn.disabled = true;
        targetBtn.style.opacity = "0.7";
    }

    const response = await authorizedFetch(`${API}/admin/students/${studentId}`, {
        method: "DELETE"
    });

    const data = await response.json();
    customAlert(data.message, "Student Deleted").then(() => loadUsers());
}

async function deleteCompany(companyId, companyName) {
    const confirmed = await customConfirm(
        `Delete company "${companyName}"? This will also remove its applications.`, "Delete Company"
    );

    if (!confirmed) {
        return;
    }

    const btnRows = Array.from(document.querySelectorAll('.reject-btn'));
    const targetBtn = btnRows.find(btn => btn.getAttribute('onclick').includes(companyId));
    if (targetBtn) {
        targetBtn.textContent = "Deleting...";
        targetBtn.disabled = true;
        targetBtn.style.opacity = "0.7";
    }

    const response = await authorizedFetch(`${API}/admin/companies/${companyId}`, {
        method: "DELETE"
    });

    const data = await response.json();
    customAlert(data.message, "Company Deleted").then(() => loadUsers());
}

async function loadApplications() {
    const filterBox = document.getElementById("adminFilterBox");
    if (filterBox) filterBox.style.display = "none";
    
    const response = await authorizedFetch(`${API}/admin/applications`);
    const applications = await response.json();

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Company</th>
                <th>Job</th>
                <th>Status</th>
                <th>Applied At</th>
            </tr>
    `;

    if (applications.length === 0) {
        html += `<tr><td colspan="8">No applications found</td></tr>`;
    } else {
        applications.forEach((application) => {
            html += `
                <tr>
                    <td>${application.id}</td>
                    <td>${application.studentName}</td>
                    <td>${application.studentBranch || "-"}</td>
                    <td>${application.studentCgpa || "-"}</td>
                    <td>${application.companyName}</td>
                    <td>${application.jobTitle || "-"}</td>
                    <td><span class="status ${application.status}">${application.status}</span></td>
                    <td>${new Date(application.appliedAt).toLocaleString()}</td>
                </tr>
            `;
        });
    }

    html += "</table>";
    renderTable(html);
}

const path = window.location.pathname.split("/").pop();
if (path === "student.html") {
    loadStudentHome();
}

if (path === "company.html") {
    loadCompanyHome();
}

if (path === "admin.html") {
    loadAdminHome();
}

if (path === "student-edit.html") {
    populateStudentEditForm();
}

if (path === "company-edit.html") {
    populateCompanyEditForm();
}

if (path === "company-job.html") {
    loadJobForm();
}

window.logout = logout;
window.loadStudentHome = loadStudentHome;
window.loadProfile = loadProfile;
window.loadEligibleJobs = loadEligibleJobs;
window.loadCompanies = loadCompanies;
window.applyJob = applyJob;
window.applyCompany = applyCompany;
window.populateStudentEditForm = populateStudentEditForm;
window.loadCompanyHome = loadCompanyHome;
window.loadCompanyJobs = loadCompanyJobs;
window.editCompanyName = editCompanyName;
window.toggleJobActive = toggleJobActive;
window.deleteJob = deleteJob;
window.loadJobForm = loadJobForm;
window.loadApplicants = loadApplicants;
window.updateStatus = updateStatus;
window.populateCompanyEditForm = populateCompanyEditForm;
window.loadAdminHome = loadAdminHome;
window.loadUsers = loadUsers;
window.loadApplications = loadApplications;
window.deleteStudent = deleteStudent;
window.deleteCompany = deleteCompany;

// Global Enter key handler for all auth forms, signups, and OTP stages
function initializeGlobalEnterListener() {
    document.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            // Only act if the user is focused on an input field
            if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") return;

            // Find the active logical grouping (a discrete form-stage for OTP, or the entire form)
            const activeContext = e.target.closest(".form-stage[style*='display: block'], .form-stage:not([style*='display: none'])") 
                                  || e.target.closest("form");
            
            if (!activeContext) return;

            // Find the primary actionable button in this specific context
            const primaryBtn = activeContext.querySelector("button[type='submit'], button.btn-primary:not([disabled])");
            
            if (primaryBtn) {
                // If it's a native form and button is type=submit, native HTML handles it cleanly.
                // However, if the button is type=button (like in our OTP multi-stage flows), we must manually click it.
                if (primaryBtn.getAttribute("type") !== "submit") {
                    e.preventDefault();
                    primaryBtn.click();
                } else if (activeContext.tagName !== "FORM") {
                    // For safety, if a submit button exists outside a standard form structure, trigger it
                    e.preventDefault();
                    primaryBtn.click();
                }
            }
        }
    });
}

// Initialize global key listeners when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGlobalEnterListener);
} else {
    initializeGlobalEnterListener();
}
