"use strict";

const state = {
    csrf: ""
};

const $ = id => document.getElementById(id);

async function api(url, opts = {}) {
    const method = (opts.method || "GET").toUpperCase();

    const headers = {
        ...(opts.headers || {})
    };

    if (method !== "GET") {
        headers["X-CSRF-Token"] = state.csrf;
    }

    let body = opts.body;

    if (body && typeof body !== "string") {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
    }

    const response = await fetch(url, {
        ...opts,
        method,
        headers,
        credentials: "same-origin",
        cache: "no-store",
        body
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.error?.message || `HTTP ${response.status}`
        );
    }

    return data;
}

async function init() {
    try {
        const boot = await api("/api/bootstrap");
        
        if (!boot) {
            console.error('Invalid bootstrap response');
            return;
        }

        state.csrf = boot.csrf_token;

        await fetchOrders();

    } catch (error) {
        $("queue").innerHTML =
            `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
}

async function fetchOrders() {
    try {
        const data = await api("/api/kitchen/orders");

        render(data.orders || []);

    } catch (error) {
        $("queue").innerHTML =
            `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character])
    );
}

function render(orders) {

    if (!orders.length) {
        $("queue").innerHTML =
            '<div class="empty">No active kitchen orders.</div>';
        return;
    }

    $("queue").innerHTML = orders.map(order => {

        const next =
            order.kitchen_status === "SENT"
                ? "PREPARING"
                : order.kitchen_status === "PREPARING"
                    ? "READY"
                    : "COMPLETED";

        const cls =
            next === "PREPARING"
                ? "prep"
                : next === "READY"
                    ? "ready"
                    : "complete";

        const buttonText =
            next === "PREPARING"
                ? "START PREPARING"
                : next === "READY"
                    ? "MARK READY"
                    : "COMPLETE";

        return `
            <article class="card">

                <div class="head">
                    <div class="token">
                        #${escapeHtml(order.token_number)}
                    </div>

                    <div class="badge">
                        ${escapeHtml(order.kitchen_status)}
                    </div>
                </div>

                <div class="items">
                    ${(order.items || []).map(item => `
                        <div class="item">
                            <span>
                                ${escapeHtml(item.quantity)}
                                ×
                                ${escapeHtml(item.item_name)}
                            </span>
                        </div>
                    `).join("")}
                </div>

                <div class="actions">
                    <button
                        class="${cls}"
                        data-order-id="${escapeHtml(order.order_id)}"
                        data-next-status="${next}"
                    >
                        ${buttonText}
                    </button>
                </div>

            </article>
        `;

    }).join("");
}


/* ============================================================
   KITCHEN BUTTON HANDLING
   ============================================================ */

$("queue").addEventListener("click", event => {

    const button = event.target.closest(
        "button[data-order-id][data-next-status]"
    );

    if (!button) {
        return;
    }

    const orderId = button.dataset.orderId;
    const status = button.dataset.nextStatus;

    updateStatus(orderId, status, button);
});


/* ============================================================
   UPDATE ORDER STATUS
   ============================================================ */

async function updateStatus(id, status, button) {
    if (button) button.disabled = true;

    try {

        await api(
            `/api/kitchen/orders/${encodeURIComponent(id)}/status`,
            {
                method: "POST",
                body: {
                    status: status
                }
            }
        );

        await fetchOrders();

    } catch (error) {

        alert(error.message);

    } finally {
        if (button) button.disabled = false;
    }
}


/* ============================================================
   PAGE EVENTS
   ============================================================ */

$("refreshBtn").addEventListener(
    "click",
    fetchOrders
);

window.addEventListener(
    "load",
    init
);

setInterval(
    fetchOrders,
    5000
);