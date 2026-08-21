"use strict";

/*
 * QSR Admin Panel
 * Frontend API client + state management
 *
 * Important:
 * - The server is the source of truth.
 * - CSRF token comes from /api/bootstrap.
 * - Never replace the entire application state with an API response.
 * - All mutating requests require a CSRF token.
 */

const state = {
    csrf: "",
    unit: null,
    categories: [],
    items: []
};
const $ = (id) => document.getElementById(id);
const unitEditForm = $("unitEditForm");
const editUnitBtn = $("editUnitBtn");
const cancelUnitBtn = $("cancelUnitBtn");
const saveUnitBtn = $("saveUnitBtn");
/* =========================================================
   DOM HELPERS
   ========================================================= */



/* =========================================================
   UI HELPERS
   ========================================================= */

let toastTimer = null;

function toast(message) {
    const element = $("toast");

    if (!element) {
        console.warn("Toast element not found:", message);
        return;
    }

    element.textContent = String(message);
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 2600);
}


function setSaveState(text) {
    const element = $("saveState");

    if (element) {
        element.textContent = String(text);
    }
}


function openMsg(title, body) {
    const titleElement = $("messageTitle");
    const bodyElement = $("messageBody");
    const dialog = $("messageDialog");

    if (titleElement) {
        titleElement.textContent = String(title);
    }

    if (bodyElement) {
        bodyElement.textContent = String(body);
    }

    if (dialog && typeof dialog.showModal === "function") {
        if (!dialog.open) {
            dialog.showModal();
        }
    } else {
        alert(`${title}\n\n${body}`);
    }
}


function closeDialog(id) {
    const dialog = $(id);

    if (dialog && dialog.open) {
        dialog.close();
    }
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function esc(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}


/* =========================================================
   BASIC VALIDATION HELPERS
   ========================================================= */

function requireCsrf() {
    if (
        typeof state.csrf !== "string" ||
        state.csrf.length < 16
    ) {
        throw new Error(
            "CSRF token is not initialized. Reload the admin page."
        );
    }
}


function getNumberValue(id, fallback = 0) {
    const value = Number($(id)?.value);

    if (!Number.isFinite(value)) {
        return fallback;
    }

    return value;
}


/* =========================================================
   API CLIENT
   ========================================================= */

async function api(url, opts = {}) {
    if (
        typeof url !== "string" ||
        !url.startsWith("/")
    ) {
        throw new Error("Invalid API URL.");
    }

    const method = String(
        opts.method || "GET"
    ).toUpperCase();

    const headers = {
        ...(opts.headers || {})
    };

    let body = opts.body;

    /*
     * Convert normal JS objects into JSON.
     * Do NOT convert FormData.
     */
    if (
        body !== undefined &&
        body !== null &&
        typeof body !== "string" &&
        !(body instanceof FormData) &&
        !(body instanceof Blob)
    ) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
    }

    /*
     * Every state-changing request requires CSRF.
     */
    if (
        method !== "GET" &&
        method !== "HEAD" &&
        method !== "OPTIONS"
    ) {
        requireCsrf();

        headers["X-CSRF-Token"] = state.csrf;
    }

    let response;

    try {
        response = await fetch(url, {
            ...opts,
            method,
            headers,
            body,
            credentials: "same-origin",
            cache: "no-store"
        });
    } catch (error) {
        throw new Error(
            `Could not connect to the local server: ${error.message}`
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    let data = null;

    /*
     * Only parse JSON when the server actually says it returned JSON.
     */
    if (
        contentType
            .toLowerCase()
            .includes("application/json")
    ) {
        try {
            data = await response.json();
        } catch {
            throw new Error(
                `Server returned invalid JSON (HTTP ${response.status}).`
            );
        }
    } else {
        /*
         * Don't expose an HTML error page to the application.
         */
        if (!response.ok) {
            throw new Error(
                `Server returned HTTP ${response.status}.`
            );
        }

        /*
         * Some successful endpoints may intentionally have
         * no JSON response.
         */
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.error?.message ||
            data?.error ||
            `HTTP ${response.status}`;

        throw new Error(String(message));
    }

    return data;
}


/* =========================================================
   BOOTSTRAP / INITIAL LOAD
   ========================================================= */

async function load() {
    setSaveState("Loading…");

    try {
        /*
         * IMPORTANT:
         * Do NOT do:
         *
         * state = await api("/api/bootstrap");
         *
         * The application state and API response are separate
         * concepts.
         */

        const data = await api("/api/bootstrap");

        if (!data || data.ok !== true) {
            throw new Error(
                "The server returned an invalid bootstrap response."
            );
        }

        /*
         * This is the important CSRF fix.
         */
        if (
            typeof data.csrf_token !== "string" ||
            data.csrf_token.length < 16
        ) {
            throw new Error(
                "The server did not provide a valid CSRF token."
            );
        }

        state.csrf = data.csrf_token;

        state.unit = data.unit ?? null;

        state.categories = Array.isArray(data.categories)
            ? data.categories
            : [];

        state.items = Array.isArray(data.items)
            ? data.items
            : [];

        render();

        setSaveState("Ready");

    } catch (error) {
        console.error(
            "Initial data load failed:",
            error
        );

        setSaveState("Connection error");

        openMsg(
            "Could not load data",
            error.message || "Unknown error"
        );
    }
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {
    const unit = state.unit || {};

    if ($("unitName")) {
        $("unitName").value = unit.name || "";
    }

    if ($("unitPhone")) {
        $("unitPhone").value = unit.phone || "";
    }

    if ($("unitEmail")) {
        $("unitEmail").value = unit.email || "";
    }

    if ($("unitAddress")) {
        $("unitAddress").value = unit.address || "";
    }

    if ($("unitDescription")) {
        $("unitDescription").value =
            unit.description || "";
    }

    if ($("currencyCode")) {
        $("currencyCode").value =
            unit.currency_code || "INR";
    }

    if ($("currencySymbol")) {
        $("currencySymbol").value =
            unit.currency_symbol || "₹";
    }

    if ($("dialogCurrencySymbol")) {
        $("dialogCurrencySymbol").textContent =
            unit.currency_symbol || "₹";
    }

    renderCategories();
    renderFilters();
    renderItems();
}


/* =========================================================
   CATEGORY RENDERING
   ========================================================= */

function renderCategories() {
    const element = $("categories");

    if (!element) {
        return;
    }

    if (!state.categories.length) {
        element.innerHTML =
            '<div class="meta">No categories.</div>';
        return;
    }

    element.innerHTML = state.categories
        .map((category) => {
            const id = esc(category.id);
            const name = esc(category.name);
            const order = Number(category.display_order) || 0;

            const status = category.active
                ? "Active"
                : "Inactive";

            const action = category.active
                ? "Deactivate"
                : "Activate";

            return `
                <div class="row">
                    <div>
                        <strong>${name}</strong>

                        <div class="meta">
                            ${esc(status)}
                            · order ${order}
                        </div>
                    </div>

                    <div class="row-actions">
                        <button
                            type="button"
                            data-edit-cat="${id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            data-del-cat="${id}"
                        >
                            ${action}
                        </button>

                        <button
                            type="button"
                            data-hard-delete-cat="${id}"
                            style="color: #ff4d4d;"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            `;
        })
        .join("");
}


/* =========================================================
   FILTERS
   ========================================================= */

function renderFilters() {
    const categoryFilter = $("categoryFilter");
    const itemCategory = $("itemCategory");

    if (categoryFilter) {
        categoryFilter.innerHTML =
            '<option value="">All categories</option>' +
            state.categories
                .map((category) => `
                    <option value="${esc(category.id)}">
                        ${esc(category.name)}
                    </option>
                `)
                .join("");
    }

    if (itemCategory) {
        itemCategory.innerHTML =
            state.categories
                .filter((category) => category.active)
                .map((category) => `
                    <option value="${esc(category.id)}">
                        ${esc(category.name)}
                    </option>
                `)
                .join("");
    }
}


/* =========================================================
   ITEM RENDERING
   ========================================================= */

function renderItems() {
    const searchElement = $("search");
    const categoryElement = $("categoryFilter");
    const itemsElement = $("items");

    if (!itemsElement) {
        return;
    }

    const query =
        searchElement?.value
            ?.trim()
            .toLowerCase() || "";

    const categoryId =
        categoryElement?.value || "";

    const filteredItems = state.items
        .filter((item) => item.active)
        .filter((item) => {
            if (
                categoryId &&
                item.category_id !== categoryId
            ) {
                return false;
            }

            if (!query) {
                return true;
            }

            const searchableText =
                `${item.name} ${item.description || ""}`
                    .toLowerCase();

            return searchableText.includes(query);
        });

    if (!filteredItems.length) {
        itemsElement.innerHTML =
            '<div class="meta">No matching items.</div>';
        return;
    }

    const categoryNames = new Map(
        state.categories.map(
            (category) => [
                category.id,
                category.name
            ]
        )
    );

    itemsElement.innerHTML =
        filteredItems
            .map((item) => {
                const itemId = esc(item.id);

                const categoryName =
                    categoryNames.get(item.category_id) ||
                    "Unknown";

                const price =
                    item.price ?? "0.00";

                return `
                    <div class="row">
                        <div>
                            <strong>
                                ${esc(item.name)}
                            </strong>

                            <div class="meta">
                                ${esc(categoryName)}
                                · ₹${esc(price)}
                                · ${
                                    item.available
                                        ? "Available"
                                        : "Sold out"
                                }
                                · ${
                                    item.is_veg
                                        ? "Veg"
                                        : "Non-veg"
                                }
                            </div>
                        </div>

                        <div class="row-actions">
                            <button
                                type="button"
                                data-edit-item="${itemId}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                data-toggle-item="${itemId}"
                            >
                                ${
                                    item.available
                                        ? "Mark sold out"
                                        : "Mark available"
                                }
                            </button>

                            <button
                                type="button"
                                data-deactivate-item="${itemId}"
                            >
                                Deactivate
                            </button>

                            <button
                                type="button"
                                data-delete-item="${itemId}"
                                style="color: #ff4d4d;"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   CATEGORY FORM
   ========================================================= */

function fillCategory(category = null) {
    if ($("categoryTitle")) {
        $("categoryTitle").textContent =
            category
                ? "Edit category"
                : "Add category";
    }

    if ($("categoryId")) {
        $("categoryId").value =
            category?.id || "";
    }

    if ($("categoryName")) {
        $("categoryName").value =
            category?.name || "";
    }

    if ($("categoryDescription")) {
        $("categoryDescription").value =
            category?.description || "";
    }

    if ($("categoryImage")) {
        $("categoryImage").value =
            category?.image_path || "";
    }

    if ($("categoryOrder")) {
        $("categoryOrder").value =
            category?.display_order ?? 0;
    }

    if ($("categoryActive")) {
        $("categoryActive").checked =
            category?.active ?? true;
    }

    const statusSpan = $("categoryUploadStatus");
    if (statusSpan) statusSpan.textContent = "";

    const fileInput = $("categoryImageFile");
    if (fileInput) fileInput.value = "";

    const dialog = $("categoryDialog");

    if (dialog && !dialog.open) {
        dialog.showModal();
    }
}


/* =========================================================
   ITEM FORM
   ========================================================= */

function fillItem(item = null) {
    if ($("itemTitle")) {
        $("itemTitle").textContent =
            item
                ? "Edit item"
                : "Add item";
    }

    if ($("itemId")) {
        $("itemId").value =
            item?.id || "";
    }

    if ($("itemName")) {
        $("itemName").value =
            item?.name || "";
    }

    if ($("itemCategory")) {
        $("itemCategory").value =
            item?.category_id ||
            state.categories.find(
                (category) => category.active
            )?.id ||
            "";
    }

    if ($("itemPrice")) {
        $("itemPrice").value =
            item?.price ?? "0.00";
    }

    if ($("itemDescription")) {
        $("itemDescription").value =
            item?.description || "";
    }

    if ($("itemImage")) {
        $("itemImage").value =
            item?.image_path || "";
    }

    if ($("itemOrder")) {
        $("itemOrder").value =
            item?.display_order ?? 0;
    }

    if ($("itemVeg")) {
        $("itemVeg").checked =
            Boolean(item?.is_veg);
    }

    if ($("itemAvailable")) {
        $("itemAvailable").checked =
            item
                ? Boolean(item.available)
                : true;
    }

    if ($("itemActive")) {
        $("itemActive").checked =
            item
                ? Boolean(item.active)
                : true;
    }

    const statusSpan = $("itemUploadStatus");
    if (statusSpan) statusSpan.textContent = "";

    const fileInput = $("itemImageFile");
    if (fileInput) fileInput.value = "";

    const dialog = $("itemDialog");

    if (dialog && !dialog.open) {
        dialog.showModal();
    }
}

/* =========================================================
   SAVE UNIT
   ========================================================= */

async function saveUnit() {
    setSaveState("Saving…");

    try {
        await api("/api/unit", {
            method: "PUT",
            body: {
                name: $("unitName")?.value?.trim() || "",
                phone: $("unitPhone")?.value?.trim() || "",
                email: $("unitEmail")?.value?.trim() || "",
                address: $("unitAddress")?.value?.trim() || "",
                description: $("unitDescription")?.value?.trim() || "",
                currency_code: $("currencyCode")?.value?.trim() || "INR",
                currency_symbol: $("currencySymbol")?.value?.trim() || "₹"
            }
        });

        toast("Unit saved");

        await load();

        closeUnitEditor();

    } catch (error) {
        setSaveState("Save failed");
        throw error;
    }
}


/* =========================================================
   SAVE CATEGORY
   ========================================================= */

async function saveCategory() {
    const saveBtn = $("saveCategoryBtn");
    const originalText = saveBtn ? saveBtn.textContent : "Save Category";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    try {
        const fileInput = $("categoryImageFile");
        if (fileInput?.files?.[0]) {
            await uploadFile(fileInput.files[0], "categoryImage", "categoryUploadStatus");
            fileInput.value = "";
        }

        const id = $("categoryId")?.value?.trim() || "";

        const body = {
            name: $("categoryName")?.value?.trim() || "",
            description: $("categoryDescription")?.value?.trim() || "",
            image_path: $("categoryImage")?.value?.trim() || null,
            display_order: getNumberValue("categoryOrder", 0),
            active: Boolean($("categoryActive")?.checked)
        };

        if (id) {
            await api(`/api/categories/${encodeURIComponent(id)}`, { method: "PUT", body });
        } else {
            await api("/api/categories", { method: "POST", body });
        }

        closeDialog("categoryDialog");
        toast("Category saved");
        await load();
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}


/* =========================================================
   SAVE ITEM
   ========================================================= */

async function saveItem() {
    const saveBtn = $("saveItemBtn");
    const originalText = saveBtn ? saveBtn.textContent : "Save Item";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    try {
        const fileInput = $("itemImageFile");
        if (fileInput?.files?.[0]) {
            await uploadFile(fileInput.files[0], "itemImage", "itemUploadStatus");
            fileInput.value = "";
        }

        const id = $("itemId")?.value?.trim() || "";

        const body = {
            name: $("itemName")?.value?.trim() || "",
            category_id: $("itemCategory")?.value?.trim() || "",
            price: $("itemPrice")?.value?.trim() || "0",
            description: $("itemDescription")?.value?.trim() || "",
            image_path: $("itemImage")?.value?.trim() || null,
            display_order: getNumberValue("itemOrder", 0),
            is_veg: Boolean($("itemVeg")?.checked),
            available: Boolean($("itemAvailable")?.checked),
            active: Boolean($("itemActive")?.checked)
        };

        if (id) {
            await api(`/api/items/${encodeURIComponent(id)}`, { method: "PUT", body });
        } else {
            await api("/api/items", { method: "POST", body });
        }

        closeDialog("itemDialog");
        toast("Item saved");
        await load();
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}


/* =========================================================
   CATEGORY ACTIONS
   ========================================================= */

async function onCategoryAction(event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    const editId =
        target.dataset.editCat;

    if (editId) {
        const category =
            state.categories.find(
                (item) => item.id === editId
            );

        if (!category) {
            throw new Error(
                "Category no longer exists. Reload the page."
            );
        }

        fillCategory(category);
        return;
    }

    const hardDeleteId =
        target.dataset.hardDeleteCat;

    if (hardDeleteId) {
        if (!confirm("All items in the category will be deleted. Are you sure you want to delete both the category and its items?")) return;
        try {
            await api(
                `/api/categories/${encodeURIComponent(hardDeleteId)}`,
                {
                    method: "DELETE"
                }
            );

            toast("Category deleted");

            await load();

        } catch (error) {
            throw new Error(
                `Category deletion failed: ${error.message}`
            );
        }
        return;
    }

    const id =
        target.dataset.delCat;

    if (!id) {
        return;
    }

    const category =
        state.categories.find(
            (item) => item.id === id
        );

    if (!category) {
        throw new Error(
            "Category no longer exists. Reload the page."
        );
    }

    const newActiveState =
        !Boolean(category.active);

    try {
        await api(
            `/api/categories/${encodeURIComponent(id)}`,
            {
                method: "PUT",

                body: {
                    name: category.name,
                    description:
                        category.description || "",
                    image_path:
                        category.image_path || "",
                    display_order:
                        Number(category.display_order) || 0,
                    active: newActiveState
                }
            }
        );

        toast(
            newActiveState
                ? "Category activated"
                : "Category deactivated"
        );

        await load();

    } catch (error) {
        throw new Error(
            `Category change failed: ${error.message}`
        );
    }
}


/* =========================================================
   ITEM ACTIONS
   ========================================================= */

async function onItemAction(event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    /*
     * EDIT
     */
    const editId =
        target.dataset.editItem;

    if (editId) {
        const item =
            state.items.find(
                (entry) => entry.id === editId
            );

        if (!item) {
            throw new Error(
                "Item no longer exists. Reload the page."
            );
        }

        fillItem(item);
        return;
    }

    /*
     * AVAILABILITY TOGGLE
     */
    const toggleId =
        target.dataset.toggleItem;

    if (toggleId) {
        const item =
            state.items.find(
                (entry) => entry.id === toggleId
            );

        if (!item) {
            throw new Error(
                "Item no longer exists. Reload the page."
            );
        }

        try {
            await api(
                `/api/items/${encodeURIComponent(toggleId)}`,
                {
                    method: "PUT",

                    body: {
                        name: item.name,
                        category_id: item.category_id,
                        price: item.price,
                        description:
                            item.description || "",
                        image_path:
                            item.image_path || "",
                        display_order:
                            Number(item.display_order) || 0,
                        is_veg:
                            Boolean(item.is_veg),
                        available:
                            !Boolean(item.available),
                        active:
                            Boolean(item.active)
                    }
                }
            );

            toast("Availability updated");

            await load();

        } catch (error) {
            throw new Error(
                `Availability update failed: ${error.message}`
            );
        }

        return;
    }

    /*
     * DEACTIVATE
     */
    const deactivateId =
        target.dataset.deactivateItem;

    if (deactivateId) {
        if (!confirm('Are you sure you want to deactivate this item?')) return;
        try {
            await api(
                `/api/items/${encodeURIComponent(deactivateId)}`,
                {
                    method: "DELETE"
                }
            );

            toast("Item deactivated");

            await load();

        } catch (error) {
            throw new Error(
                `Deactivation failed: ${error.message}`
            );
        }
    }

    /*
     * DELETE (HARD)
     */
    const deleteId =
        target.dataset.deleteItem;

    if (deleteId) {
        if (!confirm('Are you sure you want to permanently delete this item?')) return;
        try {
            await api(
                `/api/items/${encodeURIComponent(deleteId)}/delete`,
                {
                    method: "DELETE"
                }
            );

            toast("Item deleted");

            await load();

        } catch (error) {
            throw new Error(
                `Deletion failed: ${error.message}`
            );
        }
    }
}


/* =========================================================
   EXPORT BACKUP
   ========================================================= */

async function exportBackup() {
    let response;

    try {
        response = await fetch(
            "/api/backup/export",
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );
    } catch (error) {
        throw new Error(
            `Could not connect to server: ${error.message}`
        );
    }

    if (response.status === 401) {
        window.location.href = "/login";
        return;
    }

    if (!response.ok) {
        const contentType =
            response.headers.get("content-type") || "";

        if (
            contentType
                .toLowerCase()
                .includes("application/json")
        ) {
            const data = await response.json();

            throw new Error(
                data?.error?.message ||
                data?.error ||
                `HTTP ${response.status}`
            );
        }

        throw new Error(
            `Export failed: HTTP ${response.status}`
        );
    }

    const blob = await response.blob();

    if (!blob.size) {
        throw new Error(
            "Server returned an empty backup."
        );
    }

    const objectUrl =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = objectUrl;
    anchor.download =
        "qsr-backup.zip";

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 5000);

    toast("Backup exported");
}


/* =========================================================
   RESTORE BACKUP
   ========================================================= */

async function restoreBackup(file) {
    if (!file) {
        return;
    }

    requireCsrf();

    const formData = new FormData();

    formData.append(
        "backup",
        file,
        file.name
    );

    let response;

    try {
        response = await fetch(
            "/api/backup/restore",
            {
                method: "POST",

                credentials: "same-origin",

                headers: {
                    "X-CSRF-Token": state.csrf
                },

                body: formData,

                cache: "no-store"
            }
        );
    } catch (error) {
        throw new Error(
            `Could not connect to server: ${error.message}`
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    let data = null;

    if (
        contentType
            .toLowerCase()
            .includes("application/json")
    ) {
        data = await response.json();
    }

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            data?.error ||
            `HTTP ${response.status}`
        );
    }

    toast("Backup restored");

    await load();
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {
    await api(
        "/logout",
        {
            method: "POST"
        }
    );

    window.location.href = "/login";
}

function cancelCategory() {
    closeDialog("categoryDialog");
}

function cancelItem() {
    closeDialog("itemDialog");
}
/* =========================================================
   EVENT LISTENERS
   ========================================================= */

$("reloadBtn")?.addEventListener(
    "click",
    () => {
        load().catch((error) => {
            openMsg(
                "Reload failed",
                error.message
            );
        });
    }
);


$("exportBtn")?.addEventListener(
    "click",
    () => {
        exportBackup().catch((error) => {
            openMsg(
                "Export failed",
                error.message
            );
        });
    }
);


$("restoreInput")?.addEventListener(
    "change",
    (event) => {
        const file =
            event.target.files?.[0];

        restoreBackup(file)
            .catch((error) => {
                openMsg(
                    "Restore failed",
                    error.message
                );
            })
            .finally(() => {
                /*
                 * Allows selecting the same file again.
                 */
                event.target.value = "";
            });
    }
);


$("logoutBtn")?.addEventListener(
    "click",
    () => {
        logout().catch((error) => {
            openMsg(
                "Logout failed",
                error.message
            );
        });
    }
);


$("saveUnitBtn")?.addEventListener(
    "click",
    () => {
        saveUnit()
            .then(() => {
                setSaveState("Saved");
            })
            .catch((error) => {
                setSaveState("Save failed");

                openMsg(
                    "Save failed",
                    error.message
                );
            });
    }
);


async function uploadFile(file, textInputId, statusSpanId) {
    const statusSpan = $(statusSpanId);
    if (statusSpan) statusSpan.textContent = "Uploading...";

    try {
        const formData = new FormData();
        formData.append("image", file);

        const data = await api("/api/images", {
            method: "POST",
            body: formData
        });

        if (data && data.ok && data.path) {
            const input = $(textInputId);
            if (input) {
                input.value = data.path;
                input.dispatchEvent(new Event("change"));
            }
            if (statusSpan) statusSpan.textContent = "Uploaded successfully!";
        } else {
            throw new Error(data?.error?.message || "Invalid upload response");
        }
    } catch (error) {
        if (statusSpan) statusSpan.textContent = "Upload failed.";
        openMsg("Upload failed", error.message);
    }
}

$("itemUploadBtn")?.addEventListener(
    "click",
    () => {
        const fileInput = $("itemImageFile");
        const file = fileInput?.files?.[0];
        if (!file) {
            openMsg("No file selected", "Please choose an image file first.");
            return;
        }
        uploadFile(file, "itemImage", "itemUploadStatus")
            .finally(() => {
                fileInput.value = "";
            });
    }
);

$("itemImageFile")?.addEventListener("change", (e) => {
    const file = e.target?.files?.[0];
    if (file) {
        uploadFile(file, "itemImage", "itemUploadStatus");
    }
});

$("categoryUploadBtn")?.addEventListener(
    "click",
    () => {
        const fileInput = $("categoryImageFile");
        const file = fileInput?.files?.[0];
        if (!file) {
            openMsg("No file selected", "Please choose an image file first.");
            return;
        }
        uploadFile(file, "categoryImage", "categoryUploadStatus")
            .finally(() => {
                fileInput.value = "";
            });
    }
);

$("categoryImageFile")?.addEventListener("change", (e) => {
    const file = e.target?.files?.[0];
    if (file) {
        uploadFile(file, "categoryImage", "categoryUploadStatus");
    }
});


$("addCategoryBtn")?.addEventListener(
    "click",
    () => {
        fillCategory();
    }
);


$("addItemBtn")?.addEventListener(
    "click",
    () => {
        fillItem();
    }
);


$("saveCategoryBtn")?.addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        saveCategory()
            .catch((error) => {
                openMsg(
                    "Save failed",
                    error.message
                );
            });
    }
);


$("saveItemBtn")?.addEventListener(
    "click",
    (event) => {
        event.preventDefault();

        saveItem()
            .catch((error) => {
                openMsg(
                    "Save failed",
                    error.message
                );
            });
    }
);


$("messageOk")?.addEventListener(
    "click",
    () => {
        closeDialog("messageDialog");
    }
);


$("search")?.addEventListener(
    "input",
    () => {
        renderItems();
    }
);


$("categoryFilter")?.addEventListener(
    "change",
    () => {
        renderItems();
    }
);


$("categories")?.addEventListener(
    "click",
    (event) => {
        onCategoryAction(event)
            .catch((error) => {
                openMsg(
                    "Category operation failed",
                    error.message
                );
            });
    }
);
$("cancelCategoryBtn")?.addEventListener(
    "click",
    (event) => {
        event.preventDefault();
        cancelCategory();
    }
);

$("cancelItemBtn")?.addEventListener(
    "click",
    (event) => {
        event.preventDefault();
        cancelItem();
    }
);

$("items")?.addEventListener(
    "click",
    (event) => {
        onItemAction(event)
            .catch((error) => {
                openMsg(
                    "Item operation failed",
                    error.message
                );
            });
    }
);


/* =========================================================
   ORDERPAD LITE - ORDERS
   ========================================================= */

function kitchenEnabled() {
    return localStorage.getItem("orderpad_kitchen_enabled") === "true";
}


function renderKitchenToggle() {
    const toggle = $("kitchenToggle");

    if (toggle) {
        toggle.checked = kitchenEnabled();
    }
}


/* =========================================================
   FORMAT TIMESTAMP
========================================================= */

function formatOrderTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return String(timestamp);
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


/* =========================================================
   ORDER CARD
========================================================= */

function createOrderCard(order, options = {}) {

    const {
        showSendButton = false,
        showDeliveredButton = false,
        advanceLabel = null,
        advanceStatus = null,
    } = options;

    const status = String(
        order.kitchen_status || "NOT_SENT"
    ).toUpperCase();

    const statusClass = status.toLowerCase();

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const customer = order.customer_name
        ? ` • ${esc(order.customer_name)}`
        : "";

    const paymentMode = String(order.payment_mode || "").toUpperCase();
    const paymentChipClass = paymentMode === "UPI" ? "chip-upi" : "chip-cash";
    const paymentChip = paymentMode
        ? `<span class="order-payment-chip ${paymentChipClass}">${esc(paymentMode)}</span>`
        : "";

    const itemHTML = items.length
        ? items.map((item) => `
            <div>
                ${esc(item.quantity)}
                ×
                ${esc(item.item_name)}
            </div>
        `).join("")
        : `<div>No items</div>`;


    /*
     * TIMESTAMPS
     */

    const timestampHTML = `
        <div class="order-timestamps">

            <div class="order-time">
                <span>NEW</span>
                <strong>
                    ${esc(formatOrderTime(order.created_at))}
                </strong>
            </div>

            ${order.sent_at ? `
                <div class="order-time">
                    <span>SENT</span>
                    <strong>
                        ${esc(formatOrderTime(order.sent_at))}
                    </strong>
                </div>
            ` : ""}

            ${order.preparing_at ? `
                <div class="order-time">
                    <span>PREPARING</span>
                    <strong>
                        ${esc(formatOrderTime(order.preparing_at))}
                    </strong>
                </div>
            ` : ""}

            ${order.ready_at ? `
                <div class="order-time">
                    <span>READY</span>
                    <strong>
                        ${esc(formatOrderTime(order.ready_at))}
                    </strong>
                </div>
            ` : ""}

            ${order.delivered_at ? `
                <div class="order-time">
                    <span>DELIVERED</span>
                    <strong>
                        ${esc(formatOrderTime(order.delivered_at))}
                    </strong>
                </div>
            ` : ""}

        </div>
    `;


    let actionHTML = "";


    /*
     * NEW ORDER — send to kitchen
     */

    if (showSendButton) {

        actionHTML = `
            <div class="order-actions">
                <button
                    class="primary"
                    data-send-order="${esc(order.order_id)}"
                >
                    SEND TO KITCHEN
                </button>
            </div>
        `;
    }


    /*
     * INTERMEDIATE STATUS ADVANCE (Kitchen → Preparing → Ready)
     */

    if (advanceLabel && advanceStatus) {

        actionHTML = `
            <div class="order-actions">
                <button
                    class="advance-btn"
                    data-advance-order="${esc(order.order_id)}"
                    data-advance-status="${esc(advanceStatus)}"
                >
                    ${esc(advanceLabel)}
                </button>
            </div>
        `;
    }


    /*
     * READY ORDER — mark delivered / completed
     */

    if (showDeliveredButton) {

        actionHTML = `
            <div class="order-actions">
                <button
                    class="primary"
                    data-delivered-order="${esc(order.order_id)}"
                >
                    MARK DELIVERED
                </button>
            </div>
        `;
    }


    return `
        <article class="order-card">

            <div class="order-head">

                <div>

                    <div class="token">
                        #${esc(order.token_number)}${paymentChip}
                    </div>

                    <div class="meta">
                        ${esc(formatOrderTime(order.created_at))}${customer}
                    </div>

                </div>

                <span class="status ${esc(statusClass)}">
                    ${esc(status)}
                </span>

            </div>


            ${timestampHTML}


            <div class="order-items">
                ${itemHTML}
            </div>


            <div class="order-total">
                Total:
                ₹${Number(order.total || 0).toFixed(2)}

            </div>


            ${actionHTML}

        </article>
    `;
}


/* =========================================================
   RENDER FOUR ACTIVE ORDER COLUMNS
   (COMPLETED orders are shown in the Completed Orders tab)
   ========================================================= */

let newContainer, sentContainer, preparingContainer, readyContainer;

function renderOrders(orders) {

    if (!newContainer) newContainer = $("newOrders");
    if (!sentContainer) sentContainer = $("sentOrders");
    if (!preparingContainer) preparingContainer = $("preparingOrders");
    if (!readyContainer) readyContainer = $("readyOrders");


    if (
        !newContainer ||
        !sentContainer ||
        !preparingContainer ||
        !readyContainer
    ) {
        console.error(
            "Order section containers are missing from admin.html."
        );

        return;
    }


    /*
     * Split active orders by server status.
     * COMPLETED orders are not rendered here — they live in the Completed Orders tab.
     */

    const newOrders = orders.filter(
        order =>
            String(
                order.kitchen_status || "NOT_SENT"
            ).toUpperCase() === "NOT_SENT"
    );

    const sentOrders = orders.filter(
        order =>
            String(
                order.kitchen_status || ""
            ).toUpperCase() === "SENT"
    );

    const preparingOrders = orders.filter(
        order =>
            String(
                order.kitchen_status || ""
            ).toUpperCase() === "PREPARING"
    );

    const readyOrders = orders.filter(
        order =>
            String(
                order.kitchen_status || ""
            ).toUpperCase() === "READY"
    );


    /* =====================================================
       COUNTS
    ====================================================== */

    const newCount      = $("newOrdersCount");
    const sentCount     = $("sentOrdersCount");
    const preparingCount = $("preparingOrdersCount");
    const readyCount    = $("readyOrdersCount");

    if (newCount)       newCount.textContent      = newOrders.length;
    if (sentCount)      sentCount.textContent     = sentOrders.length;
    if (preparingCount) preparingCount.textContent = preparingOrders.length;
    if (readyCount)     readyCount.textContent    = readyOrders.length;


    /* =====================================================
       NEW ORDERS
    ====================================================== */

    newContainer.innerHTML =
        newOrders.length

            ? newOrders.map(order =>
                createOrderCard(
                    order,
                    {
                        showSendButton: kitchenEnabled()
                    }
                )
            ).join("")

            : `<div class="empty">No new orders.</div>`;


    /* =====================================================
       SENT TO KITCHEN — advance to Preparing
    ====================================================== */

    sentContainer.innerHTML =
        sentOrders.length

            ? sentOrders.map(order =>
                createOrderCard(
                    order,
                    {
                        advanceLabel: "Mark Preparing",
                        advanceStatus: "PREPARING"
                    }
                )
            ).join("")

            : `<div class="empty">No orders in kitchen.</div>`;


    /* =====================================================
       PREPARING — advance to Ready
    ====================================================== */

    preparingContainer.innerHTML =
        preparingOrders.length

            ? preparingOrders.map(order =>
                createOrderCard(
                    order,
                    {
                        advanceLabel: "Mark Ready",
                        advanceStatus: "READY"
                    }
                )
            ).join("")

            : `<div class="empty">No orders being prepared.</div>`;


    /* =====================================================
       READY — mark as delivered (COMPLETED)
    ====================================================== */

    readyContainer.innerHTML =
        readyOrders.length

            ? readyOrders.map(order =>
                createOrderCard(
                    order,
                    {
                        showDeliveredButton: true
                    }
                )
            ).join("")

            : `<div class="empty">No ready orders.</div>`;
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    try {

        const data =
            await api("/api/admin/orders");

        renderOrders(
            Array.isArray(data?.orders)
                ? data.orders
                : []
        );

    } catch (error) {

        console.error(
            "Could not load orders:",
            error
        );


        const containers = [
            $("newOrders"),
            $("sentOrders"),
            $("preparingOrders"),
            $("readyOrders"),
            $("deliveredOrders")
        ];


        containers.forEach(
            container => {

                if (container) {

                    container.innerHTML = `
                        <div class="empty">
                            ${esc(error.message)}
                        </div>
                    `;

                }

            }
        );
    }
}


/* =========================================================
   KITCHEN TOGGLE
========================================================= */

$("kitchenToggle")?.addEventListener(
    "change",
    (event) => {

        const enabled =
            Boolean(event.target.checked);

        localStorage.setItem(
            "orderpad_kitchen_enabled",
            enabled
                ? "true"
                : "false"
        );

        loadOrders();
    }
);


/* =========================================================
   REFRESH
========================================================= */

$("refreshOrdersBtn")?.addEventListener(
    "click",
    loadOrders
);


/* =========================================================
   ORDER ACTIONS
========================================================= */

$("ordersSection")?.addEventListener(
    "click",
    async (event) => {

        const sendButton =
            event.target.closest(
                "[data-send-order]"
            );

        const deliveredButton =
            event.target.closest(
                "[data-delivered-order]"
            );

        const advanceButton =
            event.target.closest(
                "[data-advance-order]"
            );


        /* ================================================
           SEND TO KITCHEN
        ================================================= */

        if (sendButton) {

            try {

                sendButton.disabled = true;

                await api(
                    `/api/admin/orders/${encodeURIComponent(
                        sendButton.dataset.sendOrder
                    )}/send-to-kitchen`,
                    {
                        method: "POST"
                    }
                );


                toast(
                    "Order sent to kitchen."
                );


                await loadOrders();

            } catch (error) {

                console.error(error);

                openMsg(
                    "Could not send order",
                    error.message
                );

                sendButton.disabled = false;
            }


            return;
        }


        /* ================================================
           ADVANCE STATUS (Kitchen → Preparing → Ready)
        ================================================= */

        if (advanceButton) {

            const orderId = advanceButton.dataset.advanceOrder;
            const newStatus = advanceButton.dataset.advanceStatus;

            try {

                advanceButton.disabled = true;

                await api(
                    `/api/kitchen/orders/${encodeURIComponent(orderId)}/status`,
                    {
                        method: "POST",
                        body: { status: newStatus }
                    }
                );

                toast(
                    `Order marked as ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}.`
                );

                await loadOrders();

            } catch (error) {

                console.error(error);

                openMsg(
                    "Could not update order status",
                    error.message
                );

                advanceButton.disabled = false;
            }


            return;
        }


        /* ================================================
           DELIVERED (Ready → Completed)
        ================================================= */

        if (deliveredButton) {

            try {

                deliveredButton.disabled = true;


                /*
                 * We reuse the existing kitchen status
                 * endpoint.
                 *
                 * READY → COMPLETED
                 *
                 * COMPLETED is displayed as
                 * DELIVERED in the Admin UI.
                 */

                await api(
                    `/api/kitchen/orders/${encodeURIComponent(
                        deliveredButton.dataset.deliveredOrder
                    )}/status`,
                    {
                        method: "POST",
                        body: {
                            status: "COMPLETED"
                        }
                    }
                );


                toast(
                    "Order marked as delivered."
                );


                await loadOrders();

            } catch (error) {

                console.error(error);

                openMsg(
                    "Could not mark order as delivered",
                    error.message
                );

                deliveredButton.disabled = false;
            }

        }

    }
);



/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await load();
        renderKitchenToggle();
        await loadOrders();
    } catch (error) {
        console.error("Unknown action:", error);
    }

    setInterval(loadOrders, 5000);
});


/* =========================================================
   TAB NAVIGATION LOGIC
   ========================================================= */

const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = $("pageTitle");

navItems.forEach(nav => {
    nav.addEventListener('click', (e) => {
        const targetTabId = e.currentTarget.getAttribute('data-tab');
        if (!targetTabId) return;

        // Update active class on nav
        navItems.forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Update page title from inner text (strip SVG icon text)
        if (pageTitle) {
            // Get clean text content without SVG children
            const clone = e.currentTarget.cloneNode(true);
            clone.querySelectorAll('svg').forEach(s => s.remove());
            pageTitle.textContent = clone.textContent.trim();
        }

        // Show target tab pane
        tabPanes.forEach(pane => {
            if (pane.id === targetTabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Load completed orders when that tab becomes active
        if (targetTabId === 'completedTab') {
            loadCompletedOrders(completedFilters);
        }
    });
});

function openUnitEditor() {
    unitEditForm.hidden = false;
    editUnitBtn.textContent = "Cancel";
}

function closeUnitEditor() {
    unitEditForm.hidden = true;
    editUnitBtn.textContent = "Edit Profile";
}

editUnitBtn.addEventListener("click", () => {

    if (unitEditForm.hidden) {
        openUnitEditor();
    } else {
        closeUnitEditor();
    }

});

cancelUnitBtn.addEventListener("click", () => {
    closeUnitEditor();
});


/* =========================================================
   COMPLETED ORDERS — STATE
========================================================= */

let completedFilters = {};


/* =========================================================
   COMPLETED ORDERS — LOAD
========================================================= */

async function loadCompletedOrders(filters = {}) {

    const params = new URLSearchParams();

    if (filters.payment)  params.set("payment", filters.payment);
    if (filters.from)     params.set("from",    filters.from);
    if (filters.to)       params.set("to",      filters.to);
    if (filters.search)   params.set("search",  filters.search);
    if (filters.sort)     params.set("sort",    filters.sort);

    const qs  = params.toString();
    const url = "/api/admin/orders/completed" + (qs ? "?" + qs : "");

    const tbody = $("completedOrdersBody");

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Loading…</td></tr>`;
    }

    try {

        const data = await api(url);
        const orders = Array.isArray(data?.orders) ? data.orders : [];

        renderCompletedTable(orders);

    } catch (error) {

        console.error("Could not load completed orders:", error);

        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Could not load orders: ${esc(error.message)}</td></tr>`;
        }
    }
}


/* =========================================================
   COMPLETED ORDERS — RENDER TABLE
========================================================= */

function renderCompletedTable(orders) {

    const tbody = $("completedOrdersBody");
    const meta  = $("completedOrdersMeta");

    if (!tbody) return;

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No completed orders found.</td></tr>`;
        if (meta) meta.textContent = "";
        return;
    }

    if (meta) {
        meta.textContent = `Showing ${orders.length} order${orders.length === 1 ? "" : "s"}`;
    }

    tbody.innerHTML = orders.map(order => {

        const items      = Array.isArray(order.items) ? order.items : [];
        const itemSummary = items.length
            ? items.map(i => `${i.quantity}× ${esc(i.item_name)}`).join(", ")
            : "—";

        const shortId = String(order.order_id).slice(0, 8) + "…";
        const time    = order.created_at
            ? new Date(order.created_at).toLocaleString([], {
                year: "numeric", month: "short",
                day: "2-digit",  hour: "2-digit",
                minute: "2-digit"
              })
            : "—";

        const sym   = state.unit?.currency_symbol || "₹";
        const total = `${esc(sym)}${Number(order.total || 0).toFixed(2)}`;

        const payBadge = order.payment_mode === "UPI"
            ? `<span class="payment-badge badge-upi">UPI</span>`
            : `<span class="payment-badge badge-cash">Cash</span>`;

        const customer = order.customer_name
            ? `<br><small style="color: var(--text-muted);">${esc(order.customer_name)}</small>`
            : "";

        return `
            <tr>
                <td><span class="token-cell">#${esc(String(order.token_number))}</span>${customer}</td>
                <td><span class="order-id-cell" title="${esc(order.order_id)}">${shortId}</span></td>
                <td style="white-space: nowrap; font-size: 13px;">${esc(time)}</td>
                <td class="items-cell" title="${esc(itemSummary)}">${esc(itemSummary)}</td>
                <td><strong>${total}</strong></td>
                <td>${payBadge}</td>
                <td><span class="status completed">Completed</span></td>
            </tr>
        `;

    }).join("");
}


/* =========================================================
   COMPLETED ORDERS — FILTER EVENTS
========================================================= */

$("applyFiltersBtn")?.addEventListener("click", () => {

    completedFilters = {
        search:  ($("completedSearch")?.value  || "").trim(),
        payment: $("completedPayment")?.value  || "",
        from:    $("completedFrom")?.value     || "",
        to:      $("completedTo")?.value       || "",
        sort:    $("completedSort")?.value     || "desc",
    };

    loadCompletedOrders(completedFilters);
});


$("clearFiltersBtn")?.addEventListener("click", () => {

    completedFilters = {};

    const fields = ["completedSearch", "completedPayment", "completedFrom", "completedTo"];
    fields.forEach(id => {
        const el = $(id);
        if (el) el.value = "";
    });

    const sortEl = $("completedSort");
    if (sortEl) sortEl.value = "desc";

    loadCompletedOrders({});
});

/* =========================================================
   SECURITY / PASSWORD
   ========================================================= */

const changePasswordForm = $('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = $('currentPassword').value;
        const newPassword = $('newPassword').value;
        
        // Validation
        if (newPassword.length < 8) {
            return openMsg('Validation Error', 'New password must be at least 8 characters long.');
        }
        if (!/[A-Z]/.test(newPassword)) {
            return openMsg('Validation Error', 'New password must contain at least one uppercase letter.');
        }
        if (!/[0-9]/.test(newPassword)) {
            return openMsg('Validation Error', 'New password must contain at least one number.');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return openMsg('Validation Error', 'New password must contain at least one special character.');
        }
        
        try {
            const res = await api('/api/admin/change-password', {
                method: 'POST',
                body: {
                    current_password: currentPassword,
                    new_password: newPassword
                }
            });
            
            if (res.ok) {
                toast('Password updated successfully!');
                changePasswordForm.reset();
            } else {
                openMsg('Error', res.error?.message || 'Failed to update password.');
            }
        } catch (err) {
            console.error(err);
            openMsg('Error', 'Failed to update password. Please check your connection.');
        }
    });
}

/* =========================================================
   CLOUD STATUS & DIAGNOSTICS
   ========================================================= */

async function runCloudDiagnostics() {
    const dbText = $('diagDbText');
    const dbBadge = $('diagDbBadge');
    const renderText = $('diagRenderText');
    const renderBadge = $('diagRenderBadge');
    const netlifyText = $('diagNetlifyText');
    const netlifyBadge = $('diagNetlifyBadge');

    if (dbBadge) {
        dbBadge.textContent = 'Testing...';
        dbBadge.style.background = '#fef3c7';
        dbBadge.style.color = '#b45309';
    }

    try {
        const res = await api('/api/diagnostics');
        if (res && res.aws_rds) {
            const db = res.aws_rds;
            if (db.status === 'connected') {
                const counts = db.table_counts || {};
                if (dbText) dbText.textContent = `Connected (${db.latency_ms}ms) | Categories: ${counts.categories ?? 0}, Items: ${counts.items ?? 0}, Orders: ${counts.orders ?? 0}`;
                if (dbBadge) {
                    dbBadge.textContent = 'Connected';
                    dbBadge.style.background = '#dcfce7';
                    dbBadge.style.color = '#15803d';
                }
            } else {
                if (dbText) dbText.textContent = `Error: ${db.error || 'Connection failed'}`;
                if (dbBadge) {
                    dbBadge.textContent = 'Disconnected';
                    dbBadge.style.background = '#fee2e2';
                    dbBadge.style.color = '#b91c1c';
                }
            }

            const srv = res.render_backend;
            if (renderText && srv) renderText.textContent = `Online (Port ${srv.port}) | CORS: ${srv.cors_origins}`;
            if (renderBadge) {
                renderBadge.textContent = 'Online';
                renderBadge.style.background = '#e0f2fe';
                renderBadge.style.color = '#0369a1';
            }

            if (netlifyText) netlifyText.textContent = `CORS: ${res.cors?.allowed_origins || '*'} | Live Menu API: Online`;
            if (netlifyBadge) {
                netlifyBadge.textContent = 'Ready';
                netlifyBadge.style.background = '#dcfce7';
                netlifyBadge.style.color = '#15803d';
            }
        }
        toast('Cloud diagnostics completed');
    } catch (err) {
        console.error(err);
        if (dbBadge) {
            dbBadge.textContent = 'Error';
            dbBadge.style.background = '#fee2e2';
            dbBadge.style.color = '#b91c1c';
        }
        if (dbText) dbText.textContent = 'Could not run diagnostics.';
    }
}

$('runDiagnosticsBtn')?.addEventListener('click', () => {
    runCloudDiagnostics();
});

