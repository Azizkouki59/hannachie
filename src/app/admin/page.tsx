"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  History,
  ImageDown,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Square,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "@/shims/next-link";
import { business } from "@/data/site";
import { deviceTypes, osnabrueckServiceAreas, popularBrands } from "@/lib/repairRequest";
import {
  ADMIN_TIME_SLOTS,
  ADMIN_URGENCY_META,
  SIMPLE_STATUS_OPTIONS,
  buildSingleGrossInvoiceItems,
  calculateTicketTotals,
  formatEuro,
  getTodayIsoDate,
  isMarketplaceTicket,
  normalizePhoneKey,
  normalizeSimpleStatus,
  type AdminRepairTicket,
  type AdminTimeSlot,
  type SimpleAdminStatus,
  type TicketCompletionDetails,
  type TicketCompletionOutcome,
} from "@/lib/adminTypes";
import {
  WHATSAPP_TEMPLATE_OPTIONS,
  buildAdminWhatsAppReplyUrl,
  clearAdminToken,
  downloadPrintableReceiptsHtml,
  exportTicketAsPng,
  exportTicketsToCsv,
  formatTicketTextSummary,
  getSavedAdminToken,
  mergeServerAndLocalTickets,
  removePendingSyncId,
  resolveCoordinatesForZip,
  saveAdminToken,
  shareTicketNative,
  type TicketExportType,
} from "@/lib/adminClient";
import {
  isMarketplaceItemSold,
  saveLocalMarketplaceItems,
  type MarketplaceItem,
} from "@/data/marketplaceItems";
import AdminMarketplaceManager from "@/components/AdminMarketplaceManager";
import AdminBrandCardStudio from "@/components/AdminBrandCardStudio";
import GoogleCalendarScheduler from "@/components/GoogleCalendarScheduler";
import HannachiBrandLogo from "@/components/HannachiBrandLogo";

interface TicketDraftFields {
  grossPriceInput: string;
  noteInput: string;
}

interface OrderFormState {
  editingTicketId: string | null;
  name: string;
  phone: string;
  email: string;
  visitType: "home_visit" | "workshop";
  urgency: "normal" | "express" | "notfall";
  device: string;
  brand: string;
  model: string;
  problem: string;
  zip: string;
  streetAddress: string;
  scheduledDate: string;
  scheduledSlot: AdminTimeSlot;
  totalGross: string;
  technicianNotes: string;
}

const EMPTY_ORDER_FORM: OrderFormState = {
  editingTicketId: null,
  name: "",
  phone: "",
  email: "",
  visitType: "home_visit",
  urgency: "normal",
  device: "Waschmaschine",
  brand: "Miele",
  model: "",
  problem: "",
  zip: "49082 Osnabrück",
  streetAddress: "",
  scheduledDate: "",
  scheduledSlot: "Nach Vereinbarung",
  totalGross: "",
  technicianNotes: "",
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [tickets, setTickets] = useState<AdminRepairTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Workspace Tabs (Orders | Today/Schedule | Marketplace | Visitenkarte & Logo)
  const [activeTab, setActiveTab] = useState<
    "orders" | "schedule" | "marketplace" | "branding"
  >("orders");

  // Simple Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SimpleAdminStatus | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "repair" | "marketplace" | "home_visit" | "workshop"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "urgency" | "scheduled">("newest");

  // Marketplace items cache for ticket cross-linking (real stock only)
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);

  // WhatsApp template dropdown state & Customer History drawer
  const [openWaMenuId, setOpenWaMenuId] = useState<string | null>(null);
  const [customerHistoryPhone, setCustomerHistoryPhone] = useState<string | null>(null);

  // Selection state for bulk actions
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Inline draft state for Price (€) and Note per ticket ID
  const [draftsById, setDraftsById] = useState<Record<string, TicketDraftFields>>({});

  // Inline 2-step delete confirmation per ticket ID (avoids window.confirm in iframe)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Printable DIN A4 & Multi-Format Ticket Export Studio
  const [printTickets, setPrintTickets] = useState<AdminRepairTicket[]>([]);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [ticketDocType, setTicketDocType] = useState<TicketExportType>("service");
  const [exportBusy, setExportBusy] = useState(false);

  // New / Edit Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Inline "Details" and mobile "Termin / Preis / Notiz" expansion per ticket article
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Record<string, boolean>>({});
  const [expandedScheduleIds, setExpandedScheduleIds] = useState<Record<string, boolean>>({});

  // Confirm Sold ("Verkauft") or Repaired ("Repariert") Modal
  const [completionModal, setCompletionModal] = useState<{
    ticket: AdminRepairTicket;
    outcome: TicketCompletionOutcome;
    workOrSaleSummary: string;
    hasCustomSummary: boolean;
    partsOrSerial: string;
    finalGrossInput: string;
    warrantyMonths: number;
    confirmedBy: string;
    selectedMarketplaceItemId: string;
  } | null>(null);
  const [savingCompletion, setSavingCompletion] = useState(false);

  const syncDraftsFromTickets = useCallback((list: AdminRepairTicket[]) => {
    setDraftsById(() => {
      const next: Record<string, TicketDraftFields> = {};
      for (const t of list) {
        const totals = calculateTicketTotals(t.invoiceItems || []);
        const grossStr = totals.grossTotal > 0 ? String(totals.grossTotal) : "";
        next[t.id] = {
          grossPriceInput: grossStr,
          noteInput: t.technicianNotes || "",
        };
      }
      return next;
    });
  }, []);

  const buildAdminHeaders = useCallback(
    (activeToken?: string | null, withJson = false): Record<string, string> => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (withJson) headers["Content-Type"] = "application/json";
      const resolved = activeToken ?? token;
      if (resolved) headers.Authorization = `Bearer ${resolved}`;
      return headers;
    },
    [token]
  );

  const fetchTickets = useCallback(
    async (activeToken?: string | null) => {
      setLoadingTickets(true);
      try {
        const res = await fetch("/api/admin/tickets", {
          cache: "no-store",
          credentials: "include",
          headers: buildAdminHeaders(activeToken, false),
        });
        if (res.status === 401) {
          clearAdminToken();
          setToken(null);
          setIsAuthenticated(false);
          setLoadingTickets(false);
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as { tickets?: AdminRepairTicket[] };
          if (Array.isArray(data.tickets)) {
            const authoritative = mergeServerAndLocalTickets(data.tickets, []);
            setTickets(authoritative);
            syncDraftsFromTickets(authoritative);
            setLoadingTickets(false);
            return;
          }
        }
      } catch {
        // Keep current authoritative state on transient error
      }
      setLoadingTickets(false);
    },
    [buildAdminHeaders, syncDraftsFromTickets]
  );

  useEffect(() => {
    let active = true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scannedTicketId = params.get("ticket")?.trim();
      if (scannedTicketId) {
        setSearchQuery(scannedTicketId);
      }
    }

    const restoreSession = async () => {
      const saved = getSavedAdminToken();
      if (saved) {
        setToken(saved);
        setIsAuthenticated(true);
        setAuthReady(true);
        void fetchTickets(saved);
        return;
      }
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as { authenticated?: boolean };
          if (active && data.authenticated) {
            setIsAuthenticated(true);
            void fetchTickets(null);
          }
        }
      } catch {
        // Require login when session check fails
      } finally {
        if (active) setAuthReady(true);
      }
    };

    void restoreSession();

    // Sync Marketplace items for cross-linking inside Tickets / Completion Modal (real stock only)
    fetch("/api/marketplace", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok?: boolean; items?: MarketplaceItem[] } | null) => {
        if (active && data?.ok && Array.isArray(data.items)) {
          setMarketplaceItems(data.items);
          saveLocalMarketplaceItems(data.items);
        }
      })
      .catch(() => {
        // Keep empty list on error
      });

    const onMpUpdated = (e: Event) => {
      const custom = e as CustomEvent<MarketplaceItem[]>;
      if (Array.isArray(custom.detail)) {
        setMarketplaceItems(custom.detail);
      }
    };
    window.addEventListener("hannachi:marketplace-updated", onMpUpdated);
    return () => {
      active = false;
      window.removeEventListener("hannachi:marketplace-updated", onMpUpdated);
    };
  }, [fetchTickets]);

  // Keep selectedTicketIds in sync if tickets are removed
  useEffect(() => {
    const validIds = new Set(tickets.map((t) => t.id));
    setSelectedTicketIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [tickets]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    window.setTimeout(() => {
      setSaveToast((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} kopiert: ${text}`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const candidate = pinInput.trim();
    if (!candidate) {
      setAuthError("Bitte geben Sie das Admin-Passwort ein.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: candidate }),
      });

      if (res.ok) {
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          saveAdminToken(data.token);
          setToken(data.token);
        }
        setIsAuthenticated(true);
        setPinInput("");
        setShowPassword(false);
        void fetchTickets(data.token || null);
        setAuthLoading(false);
        return;
      }

      const errData = (await res.json().catch(() => null)) as { error?: string } | null;
      setAuthError(errData?.error || "Ungültiges Passwort. Bitte erneut versuchen.");
    } catch {
      setAuthError("Verbindung zum Server fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const activeToken = token;
    clearAdminToken();
    setToken(null);
    setIsAuthenticated(false);
    setSelectedTicketIds([]);
    void fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
      headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined,
    }).catch(() => {
      // Ignore network errors on logout cleanup
    });
  };

  const updateTicket = async (
    ticketId: string,
    patch: Partial<AdminRepairTicket>,
    toastMessage = "Gespeichert",
    upsertBaseTicket?: AdminRepairTicket
  ) => {
    const nowIso = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, ...patch, updatedAt: nowIso } : t
      )
    );

    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}`, {
          method: "PATCH",
          credentials: "include",
          headers: buildAdminHeaders(token, true),
          body: JSON.stringify({
            ...patch,
            ...(upsertBaseTicket ? { upsertTicket: upsertBaseTicket } : {}),
          }),
        });
        if (res.status === 401) {
          clearAdminToken();
          setToken(null);
          setIsAuthenticated(false);
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as {
            ok?: boolean;
            ticket?: AdminRepairTicket;
            updatedMarketplaceItems?: MarketplaceItem[];
          };
          if (data.ok && data.ticket) {
            const authoritative = data.ticket;
            setTickets((prev) =>
              prev.map((t) => (t.id === ticketId ? authoritative : t))
            );
          }
          if (Array.isArray(data.updatedMarketplaceItems)) {
            setMarketplaceItems(data.updatedMarketplaceItems);
            saveLocalMarketplaceItems(data.updatedMarketplaceItems);
          }
          showToast(toastMessage);
          return;
        }
        showToast("Speichern auf dem Server fehlgeschlagen");
        void fetchTickets(token);
        return;
      } catch {
        showToast("Verbindungsfehler beim Speichern");
        void fetchTickets(token);
        return;
      }
    }

    showToast(toastMessage);
  };

  const isTicketDraftDirty = (ticket: AdminRepairTicket): boolean => {
    const draft = draftsById[ticket.id];
    if (!draft) return false;
    const savedTotals = calculateTicketTotals(ticket.invoiceItems || []);
    const savedGrossStr = savedTotals.grossTotal > 0 ? String(savedTotals.grossTotal) : "";
    const parsedDraft = parseFloat(draft.grossPriceInput.replace(",", ".").trim());
    const normalizedDraftStr =
      Number.isFinite(parsedDraft) && parsedDraft > 0 ? String(parsedDraft) : "";
    const noteChanged = draft.noteInput.trim() !== (ticket.technicianNotes || "").trim();
    const priceChanged = normalizedDraftStr !== savedGrossStr;
    return noteChanged || priceChanged;
  };

  const handleSavePriceAndNote = (ticket: AdminRepairTicket, forceToast = false) => {
    const draft = draftsById[ticket.id];
    if (!draft) return;
    if (!forceToast && !isTicketDraftDirty(ticket)) return;

    const normalizedNum = parseFloat(draft.grossPriceInput.replace(",", ".").trim());
    const grossVal = Number.isFinite(normalizedNum) && normalizedNum > 0 ? normalizedNum : 0;
    const deviceName = ticket.device.includes("Anderes")
      ? ticket.customDevice || "Hausgerät"
      : ticket.device;

    const description =
      draft.noteInput.trim() ||
      `Elektrohaushaltsgerät / Original-Ersatzteil (${ticket.brand} ${deviceName})`;

    const nextItems = buildSingleGrossInvoiceItems(grossVal, description);

    void updateTicket(
      ticket.id,
      {
        technicianNotes: draft.noteInput.trim(),
        invoiceItems: nextItems,
      },
      "Preis & Notiz gespeichert"
    );
  };

  const handleDeleteTicket = async (ticketId: string) => {
    removePendingSyncId(ticketId);
    setConfirmDeleteId(null);

    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}`, {
          method: "DELETE",
          credentials: "include",
          headers: buildAdminHeaders(token, false),
        });
        if (!res.ok) {
          showToast("Auftrag konnte nicht gelöscht werden");
          return;
        }
      } catch {
        showToast("Serverfehler beim Löschen");
        return;
      }
    }

    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicketIds((prev) => prev.filter((id) => id !== ticketId));
    showToast("Auftrag gelöscht");
  };

  const openNewOrderModal = () => {
    setOrderForm(EMPTY_ORDER_FORM);
    setIsOrderModalOpen(true);
  };

  const openEditOrderModal = (ticket: AdminRepairTicket) => {
    const totals = calculateTicketTotals(ticket.invoiceItems || []);
    setOrderForm({
      editingTicketId: ticket.id,
      name: ticket.name,
      phone: ticket.phone,
      email: ticket.email || "",
      visitType: ticket.visitType,
      urgency: ticket.urgency || "normal",
      device: ticket.device,
      brand: ticket.brand,
      model: ticket.model || "",
      problem: ticket.problem,
      zip: ticket.zip || "49082 Osnabrück",
      streetAddress: ticket.streetAddress || "",
      scheduledDate: ticket.scheduledDate || "",
      scheduledSlot: ticket.scheduledSlot || "Nach Vereinbarung",
      totalGross: totals.grossTotal > 0 ? String(totals.grossTotal) : "",
      technicianNotes: ticket.technicianNotes || "",
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveOrderModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name.trim() || !orderForm.phone.trim()) return;

    const parsedGross = parseFloat(orderForm.totalGross.replace(",", ".").trim());
    const grossVal = Number.isFinite(parsedGross) && parsedGross > 0 ? parsedGross : 0;
    const description =
      orderForm.technicianNotes.trim() ||
      `Elektrohaushaltsgerät / Original-Ersatzteil (${orderForm.brand} ${orderForm.device})`;
    const nextInvoiceItems = buildSingleGrossInvoiceItems(grossVal, description);

    // 1. Editing an existing ticket
    if (orderForm.editingTicketId) {
      const targetId = orderForm.editingTicketId;
      const patch: Partial<AdminRepairTicket> = {
        name: orderForm.name.trim(),
        phone: orderForm.phone.trim(),
        email: orderForm.email.trim(),
        visitType: orderForm.visitType,
        urgency: orderForm.urgency,
        device: orderForm.device,
        brand: orderForm.brand,
        model: orderForm.model.trim(),
        problem: orderForm.problem.trim() || "Telefonische Kundenanfrage",
        zip:
          orderForm.visitType === "home_visit"
            ? orderForm.zip
            : "49082 Osnabrück",
        streetAddress:
          orderForm.visitType === "home_visit"
            ? orderForm.streetAddress.trim()
            : "Iburger Straße 5, Im Hof",
        scheduledDate: orderForm.scheduledDate,
        scheduledSlot: orderForm.scheduledSlot,
        technicianNotes: orderForm.technicianNotes.trim(),
        invoiceItems: nextInvoiceItems,
      };

      setDraftsById((prev) => ({
        ...prev,
        [targetId]: {
          grossPriceInput: grossVal > 0 ? String(grossVal) : "",
          noteInput: orderForm.technicianNotes.trim(),
        },
      }));

      setIsOrderModalOpen(false);
      await updateTicket(targetId, patch, `Auftrag ${targetId} aktualisiert`);
      return;
    }

    // 2. Creating a brand-new ticket
    const nowIso = new Date().toISOString();
    const randomId = `HN-${Math.floor(1000 + Math.random() * 9000)}`;
    const coords = resolveCoordinatesForZip(orderForm.zip, null);

    const fallbackTicket: AdminRepairTicket = {
      id: randomId,
      createdAt: nowIso,
      updatedAt: nowIso,
      inquiryMode: "repair",
      visitType: orderForm.visitType,
      device: orderForm.device,
      customDevice: "",
      brand: orderForm.brand,
      model: orderForm.model.trim(),
      problem: orderForm.problem.trim() || "Telefonische Kundenanfrage",
      urgency: orderForm.urgency,
      callbackTime: "Jederzeit erreichbar",
      zip:
        orderForm.visitType === "home_visit"
          ? orderForm.zip
          : "49082 Osnabrück",
      streetAddress:
        orderForm.visitType === "home_visit"
          ? orderForm.streetAddress.trim()
          : "Iburger Straße 5, Im Hof",
      mapsLocationUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
      locationVerified: true,
      coordinates: coords,
      name: orderForm.name.trim(),
      phone: orderForm.phone.trim(),
      email: orderForm.email.trim(),
      photoName: null,
      status: orderForm.scheduledDate ? "in_progress" : "new",
      scheduledDate: orderForm.scheduledDate,
      scheduledSlot: orderForm.scheduledSlot,
      technicianNotes: orderForm.technicianNotes.trim(),
      invoiceNumber: `RE-${new Date().getFullYear()}-${randomId.replace("HN-", "")}`,
      invoiceItems: nextInvoiceItems,
    };

    let createdTicket = fallbackTicket;

    if (isAuthenticated) {
      try {
        const res = await fetch("/api/admin/tickets", {
          method: "POST",
          credentials: "include",
          headers: buildAdminHeaders(token, true),
          body: JSON.stringify({
            ...orderForm,
            status: orderForm.scheduledDate ? "in_progress" : "new",
            totalGross: grossVal,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { ticket?: AdminRepairTicket };
          if (data.ticket) {
            createdTicket = data.ticket;
          }
        } else {
          showToast("Auftrag konnte nicht auf dem Server gespeichert werden");
          return;
        }
      } catch {
        showToast("Server nicht erreichbar. Auftrag nicht gespeichert.");
        return;
      }
    }

    setTickets((prev) => [createdTicket, ...prev]);

    setDraftsById((prev) => ({
      ...prev,
      [createdTicket.id]: {
        grossPriceInput: grossVal > 0 ? String(grossVal) : "",
        noteInput: createdTicket.technicianNotes || "",
      },
    }));

    setIsOrderModalOpen(false);
    setOrderForm(EMPTY_ORDER_FORM);
    showToast(`Auftrag ${createdTicket.id} angelegt`);
  };

  // Helper to apply any unsaved draft inputs to a ticket before printing/exporting
  const resolveTicketWithDraft = useCallback(
    (ticket: AdminRepairTicket): AdminRepairTicket => {
      const draft = draftsById[ticket.id];
      if (!draft) return ticket;
      const normalizedNum = parseFloat(draft.grossPriceInput.replace(",", ".").trim());
      const grossVal =
        Number.isFinite(normalizedNum) && normalizedNum > 0 ? normalizedNum : 0;
      const deviceName = ticket.device.includes("Anderes")
        ? ticket.customDevice || "Hausgerät"
        : ticket.device;
      const description =
        draft.noteInput.trim() ||
        `Elektrohaushaltsgerät / Original-Ersatzteil (${ticket.brand} ${deviceName})`;
      return {
        ...ticket,
        technicianNotes: draft.noteInput.trim(),
        invoiceItems: buildSingleGrossInvoiceItems(grossVal, description),
      };
    },
    [draftsById]
  );

  // Opens the interactive DIN A4 Print & PDF Preview Modal and saves any pending draft
  const handleOpenPrintPreview = (ticket: AdminRepairTicket) => {
    if (isTicketDraftDirty(ticket)) {
      handleSavePriceAndNote(ticket);
    }
    const resolved = resolveTicketWithDraft(ticket);
    setTicketDocType(
      resolved.completionDetails?.outcome === "sold" ? "warranty_sale" : "service"
    );
    setPrintTickets([resolved]);
    setIsPrintPreviewOpen(true);
  };

  const toggleDetailsForTicket = (ticketId: string) => {
    setExpandedDetailsIds((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  const toggleScheduleForTicket = (ticketId: string) => {
    setExpandedScheduleIds((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  const buildCompletionSummaryTemplate = (
    ticket: AdminRepairTicket,
    outcome: TicketCompletionOutcome,
    warrantyMonths: number
  ): string => {
    const deviceLabel = ticket.device.includes("Anderes")
      ? ticket.customDevice || "Hausgerät"
      : ticket.device;
    const brandLabel = (ticket.brand || "").trim() || "Marken";
    const subject = `${brandLabel} ${deviceLabel}`.trim();
    const modelStr = ticket.model?.trim() ? ` (${ticket.model.trim()})` : "";
    const dl = deviceLabel.toLowerCase();
    const existingNote = ticket.technicianNotes?.trim();

    const warrantySuffix =
      warrantyMonths > 0
        ? ` Inklusive ${warrantyMonths} Monate schriftlicher Verkäufergarantie gemäß Beleg.`
        : "";

    let baseTemplate = "";
    if (outcome === "sold") {
      if (dl.includes("wasch")) {
        baseTemplate = `Geprüfte ${subject}${modelStr} verkauft & übergeben: Schontrommel hygienisch gereinigt, Pumpe & Dichtigkeits-/Schleudertest im Probelauf abgenommen.${warrantySuffix}`;
      } else if (dl.includes("trockner")) {
        baseTemplate = `Geprüfter ${subject}${modelStr} verkauft & übergeben: Luftwege, Siebe & Kondensator gereinigt, Heiz- und Trocknungstest erfolgreich abgenommen.${warrantySuffix}`;
      } else if (dl.includes("spül") || dl.includes("geschirr")) {
        baseTemplate = `Geprüfter ${subject}${modelStr} verkauft & übergeben: Sprüharme, Siebe & Aquastop kontrolliert, Spül- und Heizprogramm vollständig getestet.${warrantySuffix}`;
      } else if (dl.includes("kühl") || dl.includes("gefrier")) {
        baseTemplate = `Geprüftes ${subject}${modelStr} verkauft & übergeben: 24-Std.-Kühlleistungstest, Thermostat & Türdichtungen geprüft und abgenommen.${warrantySuffix}`;
      } else if (dl.includes("ofen") || dl.includes("herd") || dl.includes("koch")) {
        baseTemplate = `Geprüftes ${subject}${modelStr} verkauft & übergeben: Heizkreise, Regler & Sicherheitsabschaltung fachgerecht getestet.${warrantySuffix}`;
      } else if (dl.includes("ersatzteil") || dl.includes("teil")) {
        baseTemplate = `Geprüftes Ersatzteil / Zubehör (${subject}${modelStr}) mit Typenschild-Abgleich verkauft und übergeben.${warrantySuffix}`;
      } else {
        baseTemplate = `Geprüftes Gerät (${subject}${modelStr}) technisch abgenommen, verkauft und übergeben.${warrantySuffix}`;
      }
    } else {
      if (dl.includes("wasch")) {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Ersatzteil nach Typenschild übergeben bzw. Garantiefall für bei Hannachi gekauftes Gerät abgeschlossen.`;
      } else if (dl.includes("trockner")) {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Passendes Original-Ersatzteil übergeben bzw. Garantiefall für bei Hannachi gekauftes Gerät abgeschlossen.`;
      } else if (dl.includes("spül") || dl.includes("geschirr")) {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Original-Ersatzteil nach E-Nr. übergeben bzw. Garantiefall für bei Hannachi gekauftes Gerät abgeschlossen.`;
      } else if (dl.includes("kühl") || dl.includes("gefrier")) {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Original-Ersatzteil übergeben bzw. Garantiefall für bei Hannachi gekauftes Gerät abgeschlossen.`;
      } else if (dl.includes("ofen") || dl.includes("herd") || dl.includes("koch")) {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Original-Ersatzteil nach Typenschild übergeben (ohne Elektroanschluss).`;
      } else {
        baseTemplate = `Übergabe / Hannachi Verkäufergarantie für ${subject}${modelStr}: Original-Ersatzteil übergeben bzw. Garantiefall für bei Hannachi gekauftes Gerät abgeschlossen.`;
      }
    }

    if (
      existingNote &&
      !baseTemplate.toLowerCase().includes(existingNote.toLowerCase())
    ) {
      return `${baseTemplate} (${existingNote})`;
    }
    return baseTemplate;
  };

  const openCompletionModal = (
    ticket: AdminRepairTicket,
    preferredOutcome?: TicketCompletionOutcome
  ) => {
    const resolved = resolveTicketWithDraft(ticket);
    const totals = calculateTicketTotals(resolved.invoiceItems || []);
    const outcome: TicketCompletionOutcome =
      preferredOutcome || resolved.completionDetails?.outcome || "repaired";
    const warrantyMonths =
      resolved.completionDetails?.warrantyMonths ??
      (outcome === "sold" ? 12 : 6);

    const savedSummary = resolved.completionDetails?.workOrSaleSummary?.trim();
    const defaultSummary =
      savedSummary ||
      buildCompletionSummaryTemplate(resolved, outcome, warrantyMonths);

    setCompletionModal({
      ticket: resolved,
      outcome,
      workOrSaleSummary: defaultSummary,
      hasCustomSummary: Boolean(savedSummary),
      partsOrSerial:
        resolved.completionDetails?.partsOrSerial || resolved.model || "",
      finalGrossInput:
        totals.grossTotal > 0 ? String(totals.grossTotal) : "",
      warrantyMonths,
      confirmedBy:
        resolved.completionDetails?.confirmedBy || "Kamal Hannachi",
      selectedMarketplaceItemId:
        resolved.completionDetails?.marketplaceItemId ||
        resolved.marketplaceItemId ||
        "",
    });
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionModal) return;
    setSavingCompletion(true);

    const {
      ticket,
      outcome,
      workOrSaleSummary,
      partsOrSerial,
      finalGrossInput,
      warrantyMonths,
      confirmedBy,
      selectedMarketplaceItemId,
    } = completionModal;

    const normalizedNum = parseFloat(finalGrossInput.replace(",", ".").trim());
    const grossVal =
      Number.isFinite(normalizedNum) && normalizedNum > 0 ? normalizedNum : 0;
    const deviceLabel = ticket.device.includes("Anderes")
      ? ticket.customDevice || "Hausgerät"
      : ticket.device;

    const linkedMpItem =
      outcome === "sold" && selectedMarketplaceItemId
        ? marketplaceItems.find((i) => i.id === selectedMarketplaceItemId)
        : undefined;

    const cleanSummary =
      workOrSaleSummary.trim() ||
      (outcome === "sold"
        ? `Verkauft & übergeben (${ticket.brand} ${deviceLabel})`
        : `Übergabe- / Garantievorgang abgeschlossen (${ticket.brand} ${deviceLabel})`);

    const completionDetails: TicketCompletionDetails = {
      outcome,
      confirmedAt: new Date().toISOString(),
      confirmedBy: confirmedBy.trim() || "Kamal Hannachi",
      workOrSaleSummary: cleanSummary,
      partsOrSerial: partsOrSerial.trim(),
      warrantyMonths: Math.max(0, Math.min(60, warrantyMonths)),
      finalGrossAmount: grossVal,
      savedToWebsite: true,
      ...(linkedMpItem
        ? {
            marketplaceItemId: linkedMpItem.id,
            marketplaceItemTitle: linkedMpItem.title,
          }
        : {}),
    };

    const nextItems = buildSingleGrossInvoiceItems(grossVal, cleanSummary);

    setDraftsById((prev) => ({
      ...prev,
      [ticket.id]: {
        grossPriceInput: grossVal > 0 ? String(grossVal) : "",
        noteInput: cleanSummary,
      },
    }));

    // Optimistically sync linked Marketplace item to "Verkauft (Abgeschlossen)"
    if (linkedMpItem) {
      const soldAtIso = new Date().toISOString();
      setMarketplaceItems((prev) => {
        const updatedList = prev.map((m) =>
          m.id === linkedMpItem.id
            ? {
                ...m,
                availability: "Verkauft (Abgeschlossen)" as const,
                soldAt: soldAtIso,
                linkedTicketId: ticket.id,
                updatedAt: soldAtIso,
              }
            : m
        );
        saveLocalMarketplaceItems(updatedList);
        return updatedList;
      });
    }

    await updateTicket(
      ticket.id,
      {
        status: "completed",
        model: partsOrSerial.trim() || ticket.model,
        technicianNotes: cleanSummary,
        invoiceItems: nextItems,
        completionDetails,
        ...(linkedMpItem
          ? {
              marketplaceItemId: linkedMpItem.id,
              marketplaceItemTitle: linkedMpItem.title,
            }
          : {}),
      },
      outcome === "sold"
        ? linkedMpItem
          ? `Als Verkauft bestätigt · Marktplatz-Artikel „${linkedMpItem.title}“ abgeschlossen`
          : `Als Verkauft bestätigt & auf Website gespeichert (${ticket.id})`
        : `Als Service / Garantie bestätigt & gespeichert (${ticket.id})`,
      ticket
    );

    setExpandedDetailsIds((prev) => ({ ...prev, [ticket.id]: true }));
    setSavingCompletion(false);
    setCompletionModal(null);
  };

  // Customer History grouping by normalized phone number
  const ticketsByPhone = useMemo(() => {
    const map = new Map<string, AdminRepairTicket[]>();
    for (const t of tickets) {
      const key = normalizePhoneKey(t.phone);
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tickets]);

  // Summary Counts across the 3 simplified statuses + scope counts
  const counts = useMemo(() => {
    let newCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let marketplaceCount = 0;
    let repairCount = 0;
    let homeVisitCount = 0;
    let workshopCount = 0;

    for (const t of tickets) {
      const st = normalizeSimpleStatus(t.status);
      if (st === "new") newCount++;
      else if (st === "in_progress") inProgressCount++;
      else completedCount++;

      if (isMarketplaceTicket(t)) marketplaceCount++;
      else repairCount++;

      if (t.visitType === "home_visit") homeVisitCount++;
      else workshopCount++;
    }

    return {
      all: tickets.length,
      new: newCount,
      in_progress: inProgressCount,
      completed: completedCount,
      marketplace: marketplaceCount,
      repair: repairCount,
      home_visit: homeVisitCount,
      workshop: workshopCount,
    };
  }, [tickets]);

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tickets.filter((t) => {
      const simpleSt = normalizeSimpleStatus(t.status);
      if (statusFilter !== "all" && simpleSt !== statusFilter) return false;

      if (scopeFilter === "marketplace" && !isMarketplaceTicket(t)) return false;
      if (scopeFilter === "repair" && isMarketplaceTicket(t)) return false;
      if (scopeFilter === "home_visit" && t.visitType !== "home_visit") return false;
      if (scopeFilter === "workshop" && t.visitType !== "workshop") return false;

      if (q) {
        const hay = [
          t.id,
          t.name,
          t.phone,
          t.email,
          t.device,
          t.customDevice,
          t.brand,
          t.model,
          t.problem,
          t.zip,
          t.streetAddress,
          t.technicianNotes,
          t.marketplaceItemTitle || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    if (sortBy === "urgency") {
      return [...list].sort((a, b) => {
        const wa = ADMIN_URGENCY_META[a.urgency]?.priorityWeight || 1;
        const wb = ADMIN_URGENCY_META[b.urgency]?.priorityWeight || 1;
        if (wb !== wa) return wb - wa;
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
      });
    }

    if (sortBy === "scheduled") {
      return [...list].sort((a, b) => {
        const da = a.scheduledDate || "9999-99-99";
        const db = b.scheduledDate || "9999-99-99";
        if (da !== db) return da.localeCompare(db);
        return (a.scheduledSlot || "").localeCompare(b.scheduledSlot || "");
      });
    }

    return list;
  }, [tickets, statusFilter, scopeFilter, searchQuery, sortBy]);

  // Scheduled Tickets for "Heute & Termine" Agenda View
  const scheduledTickets = useMemo(() => {
    return tickets
      .filter((t) => Boolean(t.scheduledDate) && normalizeSimpleStatus(t.status) !== "completed")
      .sort((a, b) => {
        const da = a.scheduledDate || "9999-99-99";
        const db = b.scheduledDate || "9999-99-99";
        if (da !== db) return da.localeCompare(db);
        return (a.scheduledSlot || "").localeCompare(b.scheduledSlot || "");
      });
  }, [tickets]);

  const unscheduledOpenTickets = useMemo(
    () =>
      tickets.filter(
        (t) => !t.scheduledDate && normalizeSimpleStatus(t.status) !== "completed"
      ),
    [tickets]
  );

  // Selection helpers & bulk actions
  const selectedSet = useMemo(() => new Set(selectedTicketIds), [selectedTicketIds]);

  const allFilteredSelected = useMemo(
    () =>
      filteredTickets.length > 0 &&
      filteredTickets.every((t) => selectedSet.has(t.id)),
    [filteredTickets, selectedSet]
  );

  const toggleSelectTicket = (ticketId: string) => {
    setConfirmBulkDelete(false);
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectAllFiltered = () => {
    setConfirmBulkDelete(false);
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredTickets.map((t) => t.id));
      setSelectedTicketIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const combined = new Set([
        ...selectedTicketIds,
        ...filteredTickets.map((t) => t.id),
      ]);
      setSelectedTicketIds(Array.from(combined));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: SimpleAdminStatus) => {
    if (selectedTicketIds.length === 0) return;
    const targetIds = [...selectedTicketIds];
    const targetSet = new Set(targetIds);
    const nowIso = new Date().toISOString();

    setTickets((prev) =>
      prev.map((t) =>
        targetSet.has(t.id) ? { ...t, status: newStatus, updatedAt: nowIso } : t
      )
    );

    if (isAuthenticated) {
      try {
        const res = await fetch("/api/admin/tickets/bulk", {
          method: "POST",
          credentials: "include",
          headers: buildAdminHeaders(token, true),
          body: JSON.stringify({
            ids: targetIds,
            action: "status",
            status: newStatus,
          }),
        });
        if (!res.ok) {
          await fetchTickets(token);
          showToast("Sammel-Status konnte nicht gespeichert werden");
          return;
        }
      } catch {
        await fetchTickets(token);
        showToast("Serverfehler beim Sammel-Status");
        return;
      }
    }

    const statusLabel =
      SIMPLE_STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus;
    showToast(
      `${targetIds.length} ${
        targetIds.length === 1 ? "Auftrag" : "Aufträge"
      } auf „${statusLabel}“ gesetzt`
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    const targetIds = [...selectedTicketIds];
    const targetSet = new Set(targetIds);

    for (const id of targetIds) {
      removePendingSyncId(id);
    }

    setConfirmBulkDelete(false);

    if (isAuthenticated) {
      try {
        const res = await fetch("/api/admin/tickets/bulk", {
          method: "POST",
          credentials: "include",
          headers: buildAdminHeaders(token, true),
          body: JSON.stringify({
            ids: targetIds,
            action: "delete",
          }),
        });
        if (!res.ok) {
          showToast("Aufträge konnten nicht gelöscht werden");
          return;
        }
      } catch {
        showToast("Serverfehler beim Löschen");
        return;
      }
    }

    setTickets((prev) => prev.filter((t) => !targetSet.has(t.id)));
    setSelectedTicketIds([]);

    showToast(
      `${targetIds.length} ${
        targetIds.length === 1 ? "Auftrag" : "Aufträge"
      } gelöscht`
    );
  };

  const handleBulkPdfExport = () => {
    if (selectedTicketIds.length === 0) return;
    const targetSet = new Set(selectedTicketIds);
    const selectedList = tickets
      .filter((t) => targetSet.has(t.id))
      .map((t) => resolveTicketWithDraft(t));

    if (selectedList.length === 0) return;
    setPrintTickets(selectedList);
    setIsPrintPreviewOpen(true);
  };

  const handleBulkCsvExport = () => {
    if (selectedTicketIds.length === 0) return;
    const targetSet = new Set(selectedTicketIds);
    const selectedList = tickets
      .filter((t) => targetSet.has(t.id))
      .map((t) => resolveTicketWithDraft(t));
    exportTicketsToCsv(selectedList);
    showToast(`CSV für ${selectedList.length} Aufträge exportiert`);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-sm font-medium text-ink-muted">Auftragsbuch wird geladen…</div>
      </div>
    );
  }

  // ── 1. SERVER-VERIFIED ADMIN LOGIN GATE ───────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface dark:bg-slate-950 text-ink dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Website
          </Link>
          <span className="text-xs font-mono text-ink-muted tabular-nums">
            Hannachi Fachhandel · Osnabrück
          </span>
        </div>

        <div className="max-w-md w-full mx-auto my-10 bg-white dark:bg-slate-900 border border-primary/12 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="mb-5 space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <Lock className="w-3 h-3" />
              Geschützter Bereich
            </span>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <HannachiBrandLogo
                variant="lockup-auto"
                height={46}
                showSubline={false}
                decorative
              />
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight">
                Auftragsbuch
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            Geschützter Verwaltungsbereich für Kundenanfragen, Termine und Belege. Bitte melden Sie sich mit dem Admin-Passwort an.
          </p>

          <form onSubmit={(e) => void handleLogin(e)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-pin-input"
                className="block text-xs font-bold text-primary dark:text-slate-200 mb-1.5"
              >
                Admin-Passwort
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-pin-input"
                  type={showPassword ? "text" : "password"}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Passwort eingeben"
                  autoComplete="current-password"
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-surface dark:bg-slate-950 border border-primary/20 dark:border-white/15 text-base font-mono text-primary dark:text-white focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && (
                <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? "Wird geprüft…" : "Auftragsbuch öffnen"}
            </button>
          </form>
        </div>

        <div className="max-w-6xl w-full mx-auto text-center text-xs text-ink-muted">
          {business.name} · {business.street}, {business.zip} {business.city}
        </div>
      </div>
    );
  }

  // ── 2. SIMPLIFIED SINGLE-PAGE ADMIN WORKSPACE ─────────────────────────────
  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 text-ink dark:text-slate-100">
      {/* Screen-Only Workspace (Hidden when printing receipt) */}
      <div className="print:hidden pb-28 md:pb-24">
        {/* Compact Top Bar: Mobile 56px thumb-app header | Desktop 3-Zone bar */}
        <header className="sticky top-0 z-30 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-primary/10 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
            {/* Zone 1: Back link on mobile + Single-line Brand Title */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                title="Zurück zur Website"
                aria-label="Zurück zur Website"
                className="md:hidden min-h-[44px] min-w-[44px] -ml-1.5 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-primary/5 dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                href="/admin"
                aria-label="Hannachi Auftragsbuch"
                className="inline-flex items-center gap-1.5 sm:gap-2 tracking-tight whitespace-nowrap truncate"
              >
                <HannachiBrandLogo
                  variant="lockup-auto"
                  height={34}
                  showSubline={false}
                  decorative
                />
                <span className="hidden sm:inline text-sm font-bold text-ink-muted">
                  · Auftragsbuch
                </span>
              </Link>
            </div>

            {/* Zone 2: Concise Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
              <Link
                href="/"
                className="hover:text-ink transition-colors whitespace-nowrap shrink-0"
              >
                Website ansehen
              </Link>
              <Link
                href="/#anfrage"
                className="hover:text-ink transition-colors whitespace-nowrap shrink-0"
              >
                Kundenformular
              </Link>
              <button
                type="button"
                onClick={() => {
                  void fetchTickets(token);
                  showToast("Auftragsliste aktualisiert");
                }}
                className="hover:text-ink transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`} />
                Aktualisieren
              </button>
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    exportTicketsToCsv(
                      filteredTickets.map((t) => resolveTicketWithDraft(t))
                    );
                    showToast("Excel / CSV Datei heruntergeladen");
                  }}
                  className="hover:text-ink transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel / CSV
                </button>
              )}
            </nav>

            {/* Zone 3: Quick Refresh (mobile) + Primary Action + Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  void fetchTickets(token);
                  showToast("Auftragsliste aktualisiert");
                }}
                title="Aufträge aktualisieren"
                aria-label="Aufträge aktualisieren"
                className="md:hidden min-h-[44px] min-w-[44px] rounded-lg border border-primary/15 dark:border-white/15 text-ink-muted hover:text-ink transition-colors inline-flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={openNewOrderModal}
                className="min-h-[44px] px-3 sm:px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="sm:hidden">Neu</span>
                <span className="hidden sm:inline">Neuer Auftrag</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Abmelden"
                aria-label="Abmelden"
                className="min-h-[44px] min-w-[44px] sm:min-w-0 px-2.5 sm:px-3 py-2 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-semibold text-ink-muted hover:text-ink transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </header>

        {/* Save Feedback Toast */}
        {saveToast && (
          <div className="fixed top-16 inset-x-3 sm:inset-x-auto sm:top-20 sm:right-5 mx-auto sm:mx-0 max-w-sm z-50 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/15 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{saveToast}</span>
          </div>
        )}

        <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-7 space-y-3.5 sm:space-y-5">
          {/* Responsive 4-Tab Workspace Navigation: Mobile Fixed Bottom Tab Bar | Desktop Top Segmented Tabs */}
          <nav
            aria-label="Admin Bereiche"
            className="fixed bottom-0 inset-x-0 z-40 border-t border-primary/15 dark:border-white/15 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] grid grid-cols-4 gap-1 shadow-[0_-6px_24px_rgba(15,23,42,0.12)] md:static md:rounded-xl md:border md:p-1 md:shadow-xs"
          >
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`min-h-[48px] md:min-h-[44px] rounded-lg px-1 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold transition-colors flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 cursor-pointer tabular-nums ${
                activeTab === "orders"
                  ? "bg-primary text-white dark:bg-accent dark:text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full">
                Aufträge <span className="hidden sm:inline">({counts.all})</span>
                <span className="sm:hidden opacity-85">({counts.all})</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`min-h-[48px] md:min-h-[44px] rounded-lg px-1 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold transition-colors flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 cursor-pointer tabular-nums ${
                activeTab === "schedule"
                  ? "bg-primary text-white dark:bg-accent dark:text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full">Termine ({scheduledTickets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("marketplace")}
              className={`min-h-[48px] md:min-h-[44px] rounded-lg px-1 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold transition-colors flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 cursor-pointer ${
                activeTab === "marketplace"
                  ? "bg-primary text-white dark:bg-accent dark:text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full">Marktplatz</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("branding")}
              data-testid="admin-tab-branding-btn"
              className={`min-h-[48px] md:min-h-[44px] rounded-lg px-1 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-bold transition-colors flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 cursor-pointer ${
                activeTab === "branding"
                  ? "bg-primary text-white dark:bg-accent dark:text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="md:hidden truncate max-w-full">Karte</span>
              <span className="hidden md:inline truncate">Visitenkarte &amp; Logo</span>
            </button>
          </nav>

          {activeTab === "branding" ? (
            <AdminBrandCardStudio onToast={showToast} />
          ) : activeTab === "marketplace" ? (
            <AdminMarketplaceManager
              adminToken={token || ""}
              onToast={showToast}
              onItemsChanged={(items) => setMarketplaceItems(items)}
              onMarketplaceSaleTicketCreated={(newTicket, openExport) => {
                setTickets((prev) => {
                  const filtered = prev.filter((t) => t.id !== newTicket.id);
                  const next = [newTicket, ...filtered];
                  syncDraftsFromTickets(next);
                  return next;
                });
                if (openExport) {
                  setTicketDocType("warranty_sale");
                  setPrintTickets([newTicket]);
                  setIsPrintPreviewOpen(true);
                }
              }}
            />
          ) : activeTab === "schedule" ? (
            <section aria-label="Tagesplan und Termine" className="space-y-5">
              {/* Google Calendar Live Integration & 1-Click Sync */}
              <GoogleCalendarScheduler
                mode="admin"
                scheduledTickets={scheduledTickets}
                onToast={showToast}
              />

              <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-ink">
                    Geplante Übergabe- &amp; Liefertermine ({scheduledTickets.length})
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Chronologisch sortiert, ideal für unterwegs auf dem Smartphone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewOrderModal}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Termin / Auftrag anlegen
                </button>
              </div>

              {scheduledTickets.length === 0 ? (
                <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-8 text-center">
                  <p className="text-sm font-bold text-ink">
                    Aktuell sind noch keine offenen Aufträge terminiert.
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Tippen Sie unten oder im Auftragsbuch bei einem Auftrag auf „Heute“ oder „Morgen“.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {([
                    {
                      key: "today",
                      label: "Heute fällig",
                      badgeClass: "text-emerald-700 dark:text-emerald-400",
                      list: scheduledTickets.filter(
                        (t) => t.scheduledDate === getTodayIsoDate(0)
                      ),
                    },
                    {
                      key: "tomorrow",
                      label: "Morgen eingeplant",
                      badgeClass: "text-amber-700 dark:text-amber-300",
                      list: scheduledTickets.filter(
                        (t) => t.scheduledDate === getTodayIsoDate(1)
                      ),
                    },
                    {
                      key: "upcoming",
                      label: "Weitere & frühere Termine",
                      badgeClass: "text-ink-muted",
                      list: scheduledTickets.filter(
                        (t) =>
                          t.scheduledDate !== getTodayIsoDate(0) &&
                          t.scheduledDate !== getTodayIsoDate(1)
                      ),
                    },
                  ] as const)
                    .filter((g) => g.list.length > 0)
                    .map((group) => (
                      <div key={group.key} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h3
                            className={`text-xs font-extrabold uppercase tracking-wider ${group.badgeClass}`}
                          >
                            {group.label} ({group.list.length})
                          </h3>
                        </div>
                        {group.list.map((t) => {
                          const deviceLabel = t.device.includes("Anderes")
                            ? t.customDevice || "Hausgerät"
                            : t.device;
                          const resolved = resolveTicketWithDraft(t);
                          const isToday = t.scheduledDate === getTodayIsoDate(0);
                          const isTomorrow = t.scheduledDate === getTodayIsoDate(1);
                          const formattedDate = t.scheduledDate
                            ? new Date(`${t.scheduledDate}T12:00:00`).toLocaleDateString("de-DE", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : "";
                          const cleanTel = t.phone.replace(/[^\d+]/g, "");

                          return (
                            <article
                              key={t.id}
                              className="bg-surface dark:bg-slate-900 border border-primary/12 dark:border-white/10 rounded-xl p-4 sm:p-5 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold ${
                                      isToday
                                        ? "bg-emerald-600 text-white"
                                        : isTomorrow
                                        ? "bg-amber-600 text-white"
                                        : "bg-primary/10 dark:bg-white/10 text-ink"
                                    }`}
                                  >
                                    {isToday ? "HEUTE" : isTomorrow ? "MORGEN" : formattedDate}
                                  </span>
                                  <span className="font-bold text-ink">{t.scheduledSlot}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-ink-muted">{t.id}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openCompletionModal(t)}
                                  className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Abschließen</span>
                                </button>
                              </div>

                              <div>
                                <h3 className="text-base sm:text-lg font-extrabold text-ink">
                                  {t.name} ·{" "}
                                  <span className="text-accent">
                                    {t.brand} {deviceLabel}
                                  </span>
                                </h3>
                                <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                                  {t.problem}
                                </p>
                                <p className="text-xs font-mono text-ink mt-1">
                                  {t.visitType === "home_visit"
                                    ? [t.streetAddress, t.zip.replace(" (Werkstatt)", "")]
                                        .filter(Boolean)
                                        .join(", ") || "Osnabrück"
                                    : "Lieferung & Übergabe (Osnabrück & Umgebung)"}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 pt-1">
                                <a
                                  href={`tel:${cleanTel}`}
                                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                                >
                                  <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <span>Anrufen</span>
                                </a>
                                <a
                                  href={buildAdminWhatsAppReplyUrl(resolved, "appointment")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Termin bestätigen</span>
                                </a>
                                <a
                                  href={buildAdminWhatsAppReplyUrl(resolved, "on_the_way")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Auf dem Weg</span>
                                </a>
                                {t.visitType === "home_visit" && (
                                  <a
                                    href={
                                      t.mapsLocationUrl ||
                                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        [t.streetAddress, t.zip.replace(" (Werkstatt)", "")]
                                          .filter(Boolean)
                                          .join(", ")
                                      )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-primary/15 dark:border-white/15 text-xs font-bold text-ink inline-flex items-center justify-center gap-1.5"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                                    <span>Route</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintPreview(t)}
                                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-accent/40 bg-accent/10 text-xs font-bold text-ink inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <span>Beleg / PDF</span>
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ))}
                </div>
              )}

              {unscheduledOpenTickets.length > 0 && (
                <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-extrabold text-ink">
                    Noch ohne Termin ({unscheduledOpenTickets.length}): Mit 1 Tipp auf Heute legen.
                  </h3>
                  <div className="divide-y divide-primary/10 dark:divide-white/10">
                    {unscheduledOpenTickets.map((t) => (
                      <div
                        key={t.id}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <span className="font-mono font-bold text-ink">{t.id}</span> ·{" "}
                          <span className="font-bold text-ink">{t.name}</span> ({t.brand} {t.device})
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void updateTicket(
                                t.id,
                                { scheduledDate: getTodayIsoDate(0), status: "in_progress" },
                                `Auftrag ${t.id} für Heute eingeplant`
                              )
                            }
                            className="min-h-[36px] px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer"
                          >
                            Auf Heute
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void updateTicket(
                                t.id,
                                { scheduledDate: getTodayIsoDate(1), status: "in_progress" },
                                `Auftrag ${t.id} für Morgen eingeplant`
                              )
                            }
                            className="min-h-[36px] px-3 py-1 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-bold text-ink cursor-pointer"
                          >
                            Auf Morgen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <>

          {/* Compact 3-Column Mobile / Desktop Status Overview Strip (Clickable to filter) */}
          <section aria-label="Auftragsübersicht" className="grid grid-cols-3 items-stretch gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "new" ? "all" : "new")}
              className={`h-full min-h-[76px] sm:min-h-[104px] flex flex-col justify-between text-left px-3 py-2.5 sm:px-5 sm:py-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === "new"
                  ? "bg-sky-500/12 border-sky-500 ring-1 ring-sky-500/35"
                  : "bg-surface dark:bg-slate-900 border-primary/10 dark:border-white/10 hover:border-sky-500/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 w-full">
                <span data-compact-label="true" className="text-[11px] sm:text-sm font-bold sm:font-semibold text-sky-800 dark:text-sky-300 truncate">
                  <span className="sm:hidden">1. Neu</span>
                  <span className="hidden sm:inline">1. Neu eingegangen</span>
                </span>
                <span className="text-xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
                  {counts.new}
                </span>
              </div>
              <p className="hidden sm:block mt-1 text-xs text-ink-muted">
                Offene Anfragen zum Anrufen oder Terminieren
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")
              }
              className={`h-full min-h-[76px] sm:min-h-[104px] flex flex-col justify-between text-left px-3 py-2.5 sm:px-5 sm:py-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === "in_progress"
                  ? "bg-amber-500/14 border-amber-500 ring-1 ring-amber-500/35"
                  : "bg-surface dark:bg-slate-900 border-primary/10 dark:border-white/10 hover:border-amber-500/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 w-full">
                <span data-compact-label="true" className="text-[11px] sm:text-sm font-bold sm:font-semibold text-amber-900 dark:text-amber-300 truncate">
                  <span className="sm:hidden">2. Arbeit</span>
                  <span className="hidden sm:inline">2. In Arbeit / Terminiert</span>
                </span>
                <span className="text-xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
                  {counts.in_progress}
                </span>
              </div>
              <p className="hidden sm:block mt-1 text-xs text-ink-muted">
                Übergabe- oder Liefertermin vereinbart / in Bearbeitung
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(statusFilter === "completed" ? "all" : "completed")
              }
              className={`h-full min-h-[76px] sm:min-h-[104px] flex flex-col justify-between text-left px-3 py-2.5 sm:px-5 sm:py-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-emerald-500/12 border-emerald-500 ring-1 ring-emerald-500/35"
                  : "bg-surface dark:bg-slate-900 border-primary/10 dark:border-white/10 hover:border-emerald-500/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 w-full">
                <span data-compact-label="true" className="text-[11px] sm:text-sm font-bold sm:font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                  <span className="sm:hidden">3. Erledigt</span>
                  <span className="hidden sm:inline">3. Erledigt</span>
                </span>
                <span className="text-xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
                  {counts.completed}
                </span>
              </div>
              <p className="hidden sm:block mt-1 text-xs text-ink-muted">
                Abgeschlossene Verkäufe &amp; Übergaben
              </p>
            </button>
          </section>

          {/* Compact Filter, Select-All, Sort & Search Bar */}
          <section className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
              {/* Top filter utilities row */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2">
                  {/* Select All Checkbox Button (visible when tickets exist) */}
                  {filteredTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className={`min-h-[42px] sm:min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        allFilteredSelected
                          ? "bg-accent/15 border-accent text-ink"
                          : "bg-background dark:bg-slate-950 border-primary/15 dark:border-white/15 text-ink-muted hover:text-ink"
                      }`}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {allFilteredSelected
                          ? "Auswahl aufheben"
                          : `Alle (${filteredTickets.length})`}
                      </span>
                    </button>
                  )}

                  {/* Mobile status reset chip when a status filter is active */}
                  {statusFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className="sm:hidden min-h-[42px] px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer tabular-nums"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Alle ({counts.all})</span>
                    </button>
                  )}
                </div>

                {/* Mobile quick CSV download */}
                {tickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      exportTicketsToCsv(
                        filteredTickets.map((t) => resolveTicketWithDraft(t))
                      );
                      showToast("CSV Datei heruntergeladen");
                    }}
                    className="md:hidden min-h-[42px] px-3 py-1.5 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-semibold text-ink inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                )}

                {/* Segmented Status Filter (Desktop/Tablet — KPI cards above already act as 1-tap filters on phone) */}
                <div className="hidden sm:flex items-center gap-1 p-1 bg-background dark:bg-slate-950 rounded-lg border border-primary/10 dark:border-white/10 overflow-x-auto no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      statusFilter === "all"
                        ? "bg-primary text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Alle ({counts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("new")}
                    className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      statusFilter === "new"
                        ? "bg-sky-600 text-white shadow-xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Neu ({counts.new})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("in_progress")}
                    className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      statusFilter === "in_progress"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    In Arbeit ({counts.in_progress})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      statusFilter === "completed"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    Erledigt ({counts.completed})
                  </button>
                </div>
              </div>

              {/* Sort + Search Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:max-w-lg">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "newest" | "urgency" | "scheduled")
                  }
                  aria-label="Aufträge sortieren"
                  className="min-h-[44px] sm:min-h-[40px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-xs font-bold text-ink focus:outline-none focus:border-accent shrink-0"
                >
                  <option value="newest">Neueste zuerst</option>
                  <option value="urgency">Nach Dringlichkeit</option>
                  <option value="scheduled">Nach Termin</option>
                </select>

                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suche: Name, Tel, Nr., Gerät…"
                    className="w-full min-h-[44px] sm:min-h-[40px] pl-10 pr-10 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] inline-flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
                      aria-label="Suche löschen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scope Filter Row: Ersatzteile vs Marktplatz / Verkauf vs Lieferung vs Übergabe */}
            {tickets.length > 0 && (
              <div className="pt-2 border-t border-primary/8 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-ink-muted mr-1 shrink-0">
                  Bereich:
                </span>
                {(
                  [
                    { id: "all" as const, label: "Alle", desktopLabel: "Alle Bereiche", count: counts.all },
                    { id: "repair" as const, label: "Teile/Garantie", desktopLabel: "Ersatzteile & Garantie", count: counts.repair },
                    { id: "marketplace" as const, label: "Marktplatz", desktopLabel: "Marktplatz / Verkauf", count: counts.marketplace },
                    { id: "home_visit" as const, label: "Lieferung", desktopLabel: "Lieferung / Übergabe vor Ort", count: counts.home_visit },
                    { id: "workshop" as const, label: "Übergabe", desktopLabel: "Übergabe nach Termin", count: counts.workshop },
                  ]
                ).map((sc) => {
                  const active = scopeFilter === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScopeFilter(sc.id)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        active
                          ? "bg-accent text-primary shadow-xs"
                          : "bg-background dark:bg-slate-950 border border-primary/10 dark:border-white/10 text-ink-muted hover:text-ink"
                      }`}
                    >
                      <span className="sm:hidden">{sc.label} ({sc.count})</span>
                      <span className="hidden sm:inline">{sc.desktopLabel} ({sc.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Main Single-Page Customer List (Zero Mock Data) */}
          {tickets.length === 0 ? (
            <section className="bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/10 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6">
              <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent-hover dark:text-accent flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                Noch keine Kundenanfragen vorhanden
              </h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Dieses Auftragsbuch enthält <strong>keine Musterdaten</strong>. Sobald ein Kunde auf Ihrer Website das Anfrageformular absendet, erscheint die Anfrage automatisch hier. Sie können auch jederzeit einen telefonischen Auftrag eintragen.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openNewOrderModal}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Telefon-Auftrag eintragen
                </button>
                <Link
                  href="/#anfrage"
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-lg border border-primary/20 dark:border-white/15 hover:bg-primary/5 text-sm font-semibold text-ink transition-colors inline-flex items-center justify-center gap-2"
                >
                  Zum Website-Formular
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </section>
          ) : filteredTickets.length === 0 ? (
            <section className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-8 text-center">
              <p className="text-base font-semibold text-ink">
                Keine Aufträge für diesen Filter gefunden.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setScopeFilter("all");
                  setSearchQuery("");
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors cursor-pointer"
              >
                Alle Aufträge anzeigen ({tickets.length})
              </button>
            </section>
          ) : (
            <section className="space-y-4" aria-label="Kundenaufträge">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedSet.has(ticket.id);
                const simpleStatus = normalizeSimpleStatus(ticket.status);
                const isCompleted = simpleStatus === "completed";
                const comp = ticket.completionDetails;
                const isDetailsOpen = Boolean(expandedDetailsIds[ticket.id]);
                const deviceLabel = ticket.device.includes("Anderes")
                  ? ticket.customDevice || "Hausgerät"
                  : ticket.device;
                const draft = draftsById[ticket.id] || {
                  grossPriceInput: "",
                  noteInput: ticket.technicianNotes || "",
                };
                const isDirty = isTicketDraftDirty(ticket);
                const resolvedForTotals = resolveTicketWithDraft(ticket);
                const totals = calculateTicketTotals(resolvedForTotals.invoiceItems || []);
                const whatsappHref = buildAdminWhatsAppReplyUrl(resolvedForTotals);
                const cleanTel = ticket.phone.replace(/[^\d+]/g, "");
                const phoneKey = normalizePhoneKey(ticket.phone);
                const customerOrderCount = phoneKey
                  ? (ticketsByPhone.get(phoneKey)?.length ?? 1)
                  : 1;
                const linkedTitle =
                  comp?.marketplaceItemTitle || ticket.marketplaceItemTitle;

                const isScheduleOpen = Boolean(expandedScheduleIds[ticket.id]);
                const formattedShortDate = ticket.scheduledDate
                  ? ticket.scheduledDate === getTodayIsoDate(0)
                    ? "Heute"
                    : ticket.scheduledDate === getTodayIsoDate(1)
                    ? "Morgen"
                    : new Date(`${ticket.scheduledDate}T12:00:00`).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                  : null;

                return (
                  <article
                    key={ticket.id}
                    className={`bg-surface dark:bg-slate-900 border rounded-xl p-3.5 sm:p-6 shadow-xs transition-colors ${
                      isSelected
                        ? "border-accent ring-1 ring-accent/40 bg-accent/[0.02]"
                        : isCompleted
                        ? "border-emerald-500/45 ring-1 ring-emerald-500/15"
                        : "border-primary/15 dark:border-white/10"
                    }`}
                  >
                    {/* Completed Confirmation Banner (visible when article turned to Completed) */}
                    {isCompleted && (
                      <div className="mb-3.5 sm:mb-4 sm:-mx-1 px-3 sm:px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800 dark:text-emerald-300">
                            <BadgeCheck className="w-4 h-4 shrink-0" />
                            <span>
                              ABGESCHLOSSEN ·{" "}
                              {comp?.outcome === "sold"
                                ? "VERKAUFT"
                                : comp?.outcome === "repaired"
                                ? "SERVICE"
                                : "ERLEDIGT"}
                            </span>
                          </span>
                          {comp?.confirmedAt && (
                            <span className="hidden sm:inline font-semibold text-emerald-700 dark:text-emerald-300/90">
                              · Gespeichert (
                              {new Date(comp.confirmedAt).toLocaleString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              )
                            </span>
                          )}
                          {comp?.warrantyMonths ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px]">
                              {comp.warrantyMonths} Mon. Garantie
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleDetailsForTicket(ticket.id)}
                          data-testid={`ticket-completed-details-btn-${ticket.id}`}
                          className="min-h-[38px] px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>{isDetailsOpen ? "Details schließen" : "Details"}</span>
                          {isDetailsOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* 1. Card Header: Selection Checkbox + Customer Name, Phone, Meta + 1-Click 3-Status Switcher */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-primary/10 dark:border-white/10">
                      <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                        {/* Selection Checkbox for Bulk Actions */}
                        <label
                          htmlFor={`select-${ticket.id}`}
                          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-lg border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 hover:border-accent cursor-pointer shrink-0 transition-colors"
                          title="Auftrag für Sammelaktion auswählen"
                        >
                          <input
                            id={`select-${ticket.id}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTicket(ticket.id)}
                            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                            aria-label={`Auftrag ${ticket.id} von ${ticket.name} auswählen`}
                          />
                        </label>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-ink-muted font-mono tabular-nums">
                            <span className="font-bold text-ink">{ticket.id}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {new Date(ticket.createdAt).toLocaleString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {ticket.visitType === "home_visit" ? "Lieferung" : "Übergabe"}
                            </span>
                            {ticket.urgency !== "normal" && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-sans font-bold text-red-600 dark:text-red-400">
                                  {ADMIN_URGENCY_META[ticket.urgency]?.label || "Dringend"}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg sm:text-2xl font-bold text-ink tracking-tight truncate">
                              {ticket.name}
                            </h2>
                            {phoneKey && (
                              <button
                                type="button"
                                onClick={() => setCustomerHistoryPhone(phoneKey)}
                                data-testid={`customer-history-btn-${ticket.id}`}
                                className="min-h-[32px] inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer shrink-0"
                                title="Alle bisherigen Aufträge dieses Kunden anzeigen"
                              >
                                <History className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {customerOrderCount > 1
                                    ? `Historie (${customerOrderCount})`
                                    : "Kundenakte"}
                                </span>
                              </button>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-ink-muted">
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-ink tabular-nums">
                              <a
                                href={`tel:${cleanTel}`}
                                className="hover:text-accent underline decoration-accent/40 underline-offset-2"
                              >
                                {ticket.phone}
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyText(ticket.phone, "Telefonnummer")
                                }
                                title="Telefonnummer kopieren"
                                aria-label="Telefonnummer kopieren"
                                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded hover:bg-primary/10 dark:hover:bg-white/10 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </span>
                            {ticket.visitType === "home_visit" && (
                              <span className="truncate max-w-full">
                                {[ticket.streetAddress, ticket.zip.replace(" (Werkstatt)", "")]
                                  .filter(Boolean)
                                  .join(", ") || "Osnabrück"}
                              </span>
                            )}
                            {ticket.callbackTime && (
                              <span className="hidden sm:inline">
                                · Rückruf: {ticket.callbackTime}
                              </span>
                            )}
                          </div>

                          {linkedTitle && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-accent-light">
                              <ShoppingBag className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">
                                Artikel: {linkedTitle}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3-Button Status Switcher (Neu | Arbeit | Erledigt) */}
                      <div className="flex flex-col sm:items-end gap-1 shrink-0 w-full lg:w-auto">
                        <span className="hidden sm:inline text-xs font-semibold text-ink-muted">
                          Status mit 1 Klick ändern:
                        </span>
                        <div className="grid grid-cols-3 w-full lg:w-auto items-stretch p-1 rounded-xl bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 gap-1">
                          {SIMPLE_STATUS_OPTIONS.map((opt) => {
                            const active = simpleStatus === opt.value;
                            const activeClass =
                              opt.value === "new"
                                ? "bg-sky-600 text-white shadow-xs"
                                : opt.value === "in_progress"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-emerald-600 text-white shadow-xs";

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                data-compact-label="true"
                                onClick={() => {
                                  if (opt.value === "completed" && simpleStatus !== "completed") {
                                    openCompletionModal(ticket);
                                    return;
                                  }
                                  void updateTicket(
                                    ticket.id,
                                    { status: opt.value },
                                    `Status auf „${opt.label}“ gesetzt`,
                                    ticket
                                  );
                                }}
                                className={`min-h-[44px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center justify-center gap-1 ${
                                  active
                                    ? activeClass
                                    : "text-ink-muted hover:text-ink"
                                }`}
                              >
                                {active && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                                <span className="sm:hidden">
                                  {opt.value === "in_progress" ? "Arbeit" : opt.label}
                                </span>
                                <span className="hidden sm:inline">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 2. Appliance & Customer Problem Summary */}
                    <div className="py-3 sm:py-4 border-b border-primary/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4 items-start">
                      <div className="md:col-span-4">
                        <div className="text-[11px] sm:text-xs font-semibold text-ink-muted">
                          Gerät &amp; Hersteller
                        </div>
                        <div className="mt-0.5 text-sm sm:text-base font-bold text-ink">
                          {ticket.brand} · {deviceLabel}
                        </div>
                        {ticket.model && (
                          <div className="text-xs font-mono text-ink-muted mt-0.5">
                            Modell: {ticket.model}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-8">
                        <div className="text-[11px] sm:text-xs font-semibold text-ink-muted">
                          Kundenanliegen
                        </div>
                        <p className="mt-0.5 text-sm sm:text-base text-ink leading-relaxed">
                          {ticket.problem}
                        </p>
                      </div>
                    </div>

                    {/* 3. Mobile Compact Summary Bar + Collapsible Schedule/Price/Note Editor (Always Open on >= sm) */}
                    <div className="sm:hidden py-2.5 border-b border-primary/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold tabular-nums ${
                            formattedShortDate
                              ? "bg-amber-500/12 text-amber-900 dark:text-amber-300"
                              : "bg-background dark:bg-slate-950 text-ink-muted border border-primary/10 dark:border-white/10"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>
                            {formattedShortDate
                              ? `${formattedShortDate}${
                                  ticket.scheduledSlot &&
                                  ticket.scheduledSlot !== "Nach Vereinbarung"
                                    ? ` · ${ticket.scheduledSlot}`
                                    : ""
                                }`
                              : "Kein Termin"}
                          </span>
                        </span>
                        {totals.grossTotal > 0 && (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-mono font-extrabold tabular-nums">
                            {formatEuro(totals.grossTotal)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void updateTicket(
                              ticket.id,
                              {
                                scheduledDate: getTodayIsoDate(0),
                                status: simpleStatus === "new" ? "in_progress" : ticket.status,
                              },
                              "Termin auf Heute gesetzt"
                            )
                          }
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-primary/8 dark:bg-white/10 text-xs font-bold text-ink cursor-pointer"
                        >
                          Heute
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void updateTicket(
                              ticket.id,
                              {
                                scheduledDate: getTodayIsoDate(1),
                                status: simpleStatus === "new" ? "in_progress" : ticket.status,
                              },
                              "Termin auf Morgen gesetzt"
                            )
                          }
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-primary/8 dark:bg-white/10 text-xs font-bold text-ink cursor-pointer"
                        >
                          Morgen
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleScheduleForTicket(ticket.id)}
                          aria-expanded={isScheduleOpen}
                          className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                            isScheduleOpen || isDirty
                              ? "border-accent bg-accent/15 text-ink"
                              : "border-primary/15 dark:border-white/15 text-ink-muted"
                          }`}
                        >
                          <span>Termin &amp; €</span>
                          {isScheduleOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`${
                        isScheduleOpen ? "grid" : "hidden sm:grid"
                      } py-3.5 sm:py-4 border-b border-primary/10 dark:border-white/10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end`}
                    >
                      {/* Appointment Date Picker + Quick Today/Tomorrow */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label
                            htmlFor={`date-${ticket.id}`}
                            className="text-xs font-semibold text-ink flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            Termin-Datum
                          </label>
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                void updateTicket(
                                  ticket.id,
                                  {
                                    scheduledDate: getTodayIsoDate(0),
                                    status:
                                      simpleStatus === "new"
                                        ? "in_progress"
                                        : ticket.status,
                                  },
                                  "Termin auf Heute gesetzt"
                                )
                              }
                              className="min-h-[30px] px-2.5 py-0.5 rounded bg-primary/5 dark:bg-white/10 hover:bg-accent/20 text-ink font-semibold cursor-pointer"
                            >
                              Heute
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void updateTicket(
                                  ticket.id,
                                  {
                                    scheduledDate: getTodayIsoDate(1),
                                    status:
                                      simpleStatus === "new"
                                        ? "in_progress"
                                        : ticket.status,
                                  },
                                  "Termin auf Morgen gesetzt"
                                )
                              }
                              className="min-h-[30px] px-2.5 py-0.5 rounded bg-primary/5 dark:bg-white/10 hover:bg-accent/20 text-ink font-semibold cursor-pointer"
                            >
                              Morgen
                            </button>
                          </div>
                        </div>
                        <input
                          id={`date-${ticket.id}`}
                          type="date"
                          value={ticket.scheduledDate || ""}
                          onChange={(e) =>
                            void updateTicket(
                              ticket.id,
                              {
                                scheduledDate: e.target.value,
                                status:
                                  e.target.value && simpleStatus === "new"
                                    ? "in_progress"
                                    : ticket.status,
                              },
                              "Termin-Datum gespeichert"
                            )
                          }
                          className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink tabular-nums focus:outline-none focus:border-accent"
                        />
                      </div>

                      {/* Time Slot Picker */}
                      <div className="lg:col-span-3">
                        <label
                          htmlFor={`slot-${ticket.id}`}
                          className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          Uhrzeit / Zeitfenster
                        </label>
                        <select
                          id={`slot-${ticket.id}`}
                          value={ticket.scheduledSlot || "Nach Vereinbarung"}
                          onChange={(e) =>
                            void updateTicket(
                              ticket.id,
                              { scheduledSlot: e.target.value as AdminTimeSlot },
                              "Uhrzeit gespeichert"
                            )
                          }
                          className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink focus:outline-none focus:border-accent"
                        >
                          {ADMIN_TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Simple Total Price (€ inkl. MwSt.) */}
                      <div className="lg:col-span-2">
                        <label
                          htmlFor={`price-${ticket.id}`}
                          className="block text-xs font-semibold text-ink mb-1.5"
                        >
                          Gesamtpreis (€)
                        </label>
                        <div className="relative">
                          <input
                            id={`price-${ticket.id}`}
                            type="text"
                            inputMode="decimal"
                            value={draft.grossPriceInput}
                            onChange={(e) =>
                              setDraftsById((prev) => ({
                                ...prev,
                                [ticket.id]: {
                                  ...draft,
                                  grossPriceInput: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => handleSavePriceAndNote(ticket)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSavePriceAndNote(ticket, true);
                              }
                            }}
                            placeholder="z. B. 89"
                            className="w-full min-h-[44px] sm:min-h-[42px] pl-3 pr-7 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono font-bold text-ink tabular-nums focus:outline-none focus:border-accent"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-muted pointer-events-none">
                            €
                          </span>
                        </div>
                      </div>

                      {/* Short Note / Performed Work + Explicit Save Button */}
                      <div className="lg:col-span-4">
                        <label
                          htmlFor={`note-${ticket.id}`}
                          className="block text-xs font-semibold text-ink mb-1.5"
                        >
                          Notiz / Durchgeführte Arbeit
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`note-${ticket.id}`}
                            type="text"
                            value={draft.noteInput}
                            onChange={(e) =>
                              setDraftsById((prev) => ({
                                ...prev,
                                [ticket.id]: {
                                  ...draft,
                                  noteInput: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => handleSavePriceAndNote(ticket)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSavePriceAndNote(ticket, true);
                              }
                            }}
                            placeholder="z. B. Pumpe gereinigt…"
                            className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink focus:outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePriceAndNote(ticket, true)}
                            className={`min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                              isDirty
                                ? "bg-accent hover:bg-accent-hover text-white shadow-xs"
                                : "border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 text-ink-muted hover:text-ink"
                            }`}
                            title="Preis und Notiz speichern"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isDirty ? "Speichern" : "OK"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Bottom 1-Click Everyday Actions + WhatsApp + Sold/Repaired Confirmation */}
                    <div className="pt-3 sm:pt-4 flex flex-col gap-2.5 sm:gap-3">
                      {!isCompleted && (
                        <div className="grid grid-cols-2 items-stretch gap-2 p-2 sm:p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25">
                          <button
                            type="button"
                            onClick={() => openCompletionModal(ticket, "sold")}
                            data-testid={`confirm-sold-btn-${ticket.id}`}
                            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
                          >
                            <ShoppingBag className="w-4 h-4 text-accent shrink-0" />
                            <span className="sm:hidden">Verkauft</span>
                            <span className="hidden sm:inline">Als verkauft bestätigen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openCompletionModal(ticket, "repaired")}
                            data-testid={`confirm-repaired-btn-${ticket.id}`}
                            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
                          >
                            <Wrench className="w-4 h-4 shrink-0" />
                            <span className="sm:hidden">Übergabe fertig</span>
                            <span className="hidden sm:inline">Übergabe / Garantie bestätigen</span>
                          </button>
                        </div>
                      )}

                      {/* 1-Tap WhatsApp Quick Reply Strip (Desktop >= sm — Mobile uses the clean WhatsApp + Vorlage bottom sheet button below) */}
                      <div className="hidden sm:block rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2 px-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>1-Klick WhatsApp-Antwort an {ticket.name}</span>
                          </span>
                          <span className="text-[11px] font-mono text-ink-muted">
                            Direktversand mit Auftragsdaten
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {WHATSAPP_TEMPLATE_OPTIONS.map((tpl) => (
                            <a
                              key={tpl.id}
                              href={buildAdminWhatsAppReplyUrl(resolvedForTotals, tpl.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={tpl.shortDesc}
                              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-emerald-600/30 bg-white dark:bg-slate-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-xs font-extrabold text-emerald-900 dark:text-emerald-200 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{tpl.shortLabel}</span>
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-2.5">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2">
                          {/* 1-Click Call */}
                          <a
                            href={`tel:${cleanTel}`}
                            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                          >
                            <Phone className="w-4 h-4 text-accent shrink-0" />
                            <span>Anrufen</span>
                          </a>

                          {/* 1-Click Auto WhatsApp Reply + Mobile-Safe Bottom Sheet / Desktop Popover */}
                          <div className="relative inline-flex items-stretch">
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] flex-1 px-3 sm:px-3.5 py-2 rounded-l-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>WhatsApp</span>
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenWaMenuId((prev) =>
                                  prev === ticket.id ? null : ticket.id
                                )
                              }
                              aria-label="WhatsApp-Vorlage wählen"
                              aria-expanded={openWaMenuId === ticket.id}
                              data-testid={`whatsapp-template-toggle-${ticket.id}`}
                              className="min-h-[44px] min-w-[40px] px-2.5 rounded-r-xl bg-emerald-700 hover:bg-emerald-800 border-l border-emerald-500/40 text-white inline-flex items-center justify-center cursor-pointer"
                              title="Fertige WhatsApp-Textvorlage wählen"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {openWaMenuId === ticket.id && (
                              <>
                                {/* Mobile tap-away backdrop */}
                                <div
                                  className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
                                  onClick={() => setOpenWaMenuId(null)}
                                  aria-hidden="true"
                                />
                                <div
                                  role="menu"
                                  className="fixed inset-x-3 bottom-[76px] z-50 sm:inset-x-auto sm:absolute sm:left-0 sm:bottom-full sm:mb-1.5 sm:z-30 sm:w-72 rounded-2xl sm:rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 shadow-2xl sm:shadow-xl p-2 sm:p-1.5 space-y-1"
                                >
                                  <div className="px-2.5 py-1.5 sm:py-1 flex items-center justify-between text-xs sm:text-[11px] font-bold text-ink-muted border-b border-primary/8 dark:border-white/10">
                                    <span>WhatsApp-Vorlage an {ticket.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setOpenWaMenuId(null)}
                                      className="min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center hover:text-ink cursor-pointer"
                                      aria-label="Menü schließen"
                                    >
                                      <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  </div>
                                  {WHATSAPP_TEMPLATE_OPTIONS.map((tpl) => (
                                    <a
                                      key={tpl.id}
                                      href={buildAdminWhatsAppReplyUrl(
                                        resolvedForTotals,
                                        tpl.id
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => setOpenWaMenuId(null)}
                                      className="block rounded-xl sm:rounded-lg px-3 py-2.5 sm:px-2.5 sm:py-2 hover:bg-emerald-500/10 active:bg-emerald-500/15 transition-colors"
                                    >
                                      <div className="text-sm sm:text-xs font-extrabold text-ink">
                                        {tpl.label}
                                      </div>
                                      <div className="text-xs sm:text-[11px] text-ink-muted">
                                        {tpl.shortDesc}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* 1-Click Google Maps Route (if Home Visit) */}
                          {ticket.visitType === "home_visit" && (
                            <a
                              href={
                                ticket.mapsLocationUrl ||
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  [ticket.streetAddress, ticket.zip.replace(" (Werkstatt)", "")]
                                    .filter(Boolean)
                                    .join(", ")
                                )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="col-span-2 sm:col-span-1 min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-primary/15 dark:border-white/15 hover:bg-primary/5 text-xs sm:text-sm font-semibold text-ink transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                            >
                              <MapPin className="w-4 h-4 text-accent shrink-0" />
                              <span>Route starten</span>
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2">
                          {/* Dedicated "Details" Button */}
                          <button
                            type="button"
                            onClick={() => toggleDetailsForTicket(ticket.id)}
                            data-testid={`ticket-details-btn-${ticket.id}`}
                            aria-expanded={isDetailsOpen}
                            className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-extrabold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                              isDetailsOpen
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-primary/20 dark:border-white/20 bg-background dark:bg-slate-950 text-ink hover:border-accent"
                            }`}
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>Details</span>
                            {isDetailsOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>

                          {/* 1-Click Pro Ticket Export & Print Preview */}
                          <button
                            type="button"
                            onClick={() => handleOpenPrintPreview(ticket)}
                            data-testid={`export-ticket-btn-${ticket.id}`}
                            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-accent/45 bg-accent/12 hover:bg-accent hover:text-primary text-xs sm:text-sm font-extrabold text-ink transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-accent shrink-0" />
                            <span className="sm:hidden">Beleg / PDF</span>
                            <span className="hidden sm:inline">Ticket exportieren</span>
                            {totals.grossTotal > 0 && (
                              <span className="hidden sm:inline font-mono text-xs opacity-80 tabular-nums">
                                ({formatEuro(totals.grossTotal)})
                              </span>
                            )}
                          </button>

                          {/* Edit Ticket Details Button */}
                          <button
                            type="button"
                            onClick={() => openEditOrderModal(ticket)}
                            title="Kundendaten & Gerät bearbeiten"
                            className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-primary/15 dark:border-white/15 hover:bg-primary/5 text-xs font-semibold text-ink transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 shrink-0" />
                            <span>Bearbeiten</span>
                          </button>

                          {/* 2-Step Inline Delete Button */}
                          {confirmDeleteId === ticket.id ? (
                            <div className="min-h-[44px] inline-flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-xl px-2.5 py-1.5">
                              <span className="text-xs font-bold text-red-700 dark:text-red-300">
                                Löschen?
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleDeleteTicket(ticket.id)}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Ja
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="min-h-[34px] px-2 py-1 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                              >
                                Nein
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(ticket.id)}
                              title="Auftrag löschen"
                              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-primary/10 sm:border-transparent dark:border-white/10 sm:dark:border-transparent text-ink-muted hover:text-red-600 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <span>Löschen</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Full Details Drawer inside <article> */}
                      {isDetailsOpen && (
                        <div
                          data-testid={`ticket-details-panel-${ticket.id}`}
                          className="mt-1 rounded-xl border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 p-4 sm:p-5 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-primary/10 dark:border-white/10">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-ink">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>
                                Vollständige Auftrags- &amp; Abschlussdetails ({ticket.id})
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-ink-muted">
                              Beleg-Nr.: {ticket.invoiceNumber}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="font-bold text-ink-muted uppercase tracking-wide text-[11px]">
                                Abschluss-Status
                              </div>
                              <div className="font-extrabold text-ink text-sm">
                                {isCompleted
                                  ? comp?.outcome === "sold"
                                    ? "Abgeschlossen · Verkauft"
                                    : comp?.outcome === "repaired"
                                    ? "Abgeschlossen · Übergabe / Garantie"
                                    : "Abgeschlossen (Erledigt)"
                                  : simpleStatus === "in_progress"
                                  ? "In Arbeit / Terminiert"
                                  : "Neu eingegangen"}
                              </div>
                              {comp && (
                                <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                  Gespeichert am{" "}
                                  {new Date(comp.confirmedAt).toLocaleString("de-DE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  ({comp.confirmedBy})
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="font-bold text-ink-muted uppercase tracking-wide text-[11px]">
                                Gerät, Teile &amp; E-Nr.
                              </div>
                              <div className="font-bold text-ink text-sm">
                                {ticket.brand} · {deviceLabel}
                              </div>
                              <div className="font-mono text-ink-muted">
                                Modell / E-Nr.:{" "}
                                {comp?.partsOrSerial || ticket.model || "Nicht angegeben"}
                              </div>
                              <div>
                                Übergabe-Art:{" "}
                                {ticket.visitType === "home_visit"
                                  ? "Lieferung / Übergabe vor Ort"
                                  : "Übergabe nach Termin"}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="font-bold text-ink-muted uppercase tracking-wide text-[11px]">
                                Abrechnung &amp; Garantie
                              </div>
                              <div className="font-mono font-extrabold text-ink text-sm tabular-nums">
                                {totals.grossTotal > 0
                                  ? `${formatEuro(totals.grossTotal)} (inkl. 19 % MwSt.)`
                                  : "Preis auf Anfrage / nach Vereinbarung"}
                              </div>
                              {totals.grossTotal > 0 && (
                                <div className="font-mono text-ink-muted tabular-nums">
                                  Netto: {formatEuro(totals.netTotal)} · MwSt.:{" "}
                                  {formatEuro(totals.vatAmount)}
                                </div>
                              )}
                              <div>
                                Garantie:{" "}
                                {comp?.warrantyMonths
                                  ? `${comp.warrantyMonths} Monate schriftliche Garantie`
                                  : comp?.outcome === "sold"
                                  ? "Inkl. schriftlicher Verkäufergarantie"
                                  : "Gemäß Prüfprotokoll"}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-3 space-y-1.5 text-xs">
                            <div>
                              <span className="font-bold text-ink">Kundenanliegen: </span>
                              <span className="text-ink-muted">{ticket.problem}</span>
                            </div>
                            {(comp?.workOrSaleSummary || ticket.technicianNotes) && (
                              <div>
                                <span className="font-bold text-ink">
                                  {comp?.outcome === "sold"
                                    ? "Verkaufs- & Übergabebestätigung: "
                                    : "Durchgeführte Arbeit / Servicenotiz: "}
                                </span>
                                <span className="text-ink">
                                  {comp?.workOrSaleSummary || ticket.technicianNotes}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-ink">Kunde &amp; Ort: </span>
                              <span className="text-ink-muted">
                                {ticket.name} · Tel.: {ticket.phone} ·{" "}
                                {ticket.visitType === "home_visit"
                                  ? [ticket.streetAddress, ticket.zip.replace(" (Werkstatt)", "")]
                                      .filter(Boolean)
                                      .join(", ") || "Osnabrück"
                                  : "Lieferung & Übergabe (Osnabrück & Umgebung)"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => openCompletionModal(ticket)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-primary/20 dark:border-white/20 hover:border-accent text-xs font-bold text-ink inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>
                                {isCompleted
                                  ? "Abschluss (Verkauft / Service) bearbeiten"
                                  : "Jetzt als Verkauft oder Service abschließen"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenPrintPreview(ticket)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>
                                {comp?.outcome === "sold"
                                  ? "Kauf- & Garantiebeleg exportieren"
                                  : "Service-Beleg exportieren"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
            </>
          )}
        </main>

        {/* ── FLOATING BULK ACTION BAR (Hovers cleanly above mobile bottom tab bar) ── */}
        {selectedTicketIds.length > 0 && (
          <div
            role="region"
            aria-label="Sammelaktionen für ausgewählte Aufträge"
            className="fixed bottom-[76px] md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] max-w-4xl bg-primary text-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl border border-white/15 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-3"
          >
            {/* Left: Selected Count & Clear Selection */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center min-w-[26px] h-6 sm:min-w-[28px] sm:h-7 px-2 rounded-md bg-accent text-primary font-mono font-bold text-xs tabular-nums">
                  {selectedTicketIds.length}
                </span>
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {selectedTicketIds.length === 1
                    ? "Auftrag ausgewählt"
                    : "Aufträge ausgewählt"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicketIds([]);
                  setConfirmBulkDelete(false);
                }}
                className="min-h-[32px] px-2 text-xs text-white/80 hover:text-white underline whitespace-nowrap cursor-pointer"
              >
                Aufheben
              </button>
            </div>

            {/* Right: Mass Status Update + Bulk PDF Export + Bulk CSV + Bulk Delete */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                <span className="text-[11px] font-medium text-white/80 px-2 hidden sm:inline whitespace-nowrap">
                  Status setzen:
                </span>
                <button
                  type="button"
                  onClick={() => void handleBulkStatusUpdate("new")}
                  className="min-h-[34px] px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Neu
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkStatusUpdate("in_progress")}
                  className="min-h-[34px] px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Arbeit
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkStatusUpdate("completed")}
                  className="min-h-[34px] px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Erledigt
                </button>
              </div>

              <button
                type="button"
                onClick={handleBulkPdfExport}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="sm:hidden">PDF ({selectedTicketIds.length})</span>
                <span className="hidden sm:inline">
                  Sammel-PDF / Drucken ({selectedTicketIds.length})
                </span>
              </button>

              <button
                type="button"
                onClick={handleBulkCsvExport}
                className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {confirmBulkDelete ? (
                <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-400/40 rounded-lg px-2.5 py-1">
                  <span className="text-xs font-bold text-red-200">
                    {selectedTicketIds.length} löschen?
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    className="min-h-[30px] px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-500 cursor-pointer"
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(false)}
                    className="min-h-[30px] px-1.5 py-0.5 text-xs text-white/80 hover:text-white cursor-pointer"
                  >
                    Nein
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  title="Ausgewählte Aufträge löschen"
                  aria-label="Ausgewählte Aufträge löschen"
                  className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-red-600/80 text-white/80 hover:text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal: "+ Neuer Auftrag" / "Auftrag bearbeiten" (Mobile-Safe Sticky Footer Sheet) */}
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-primary/10 dark:border-white/10 shrink-0 bg-surface dark:bg-slate-900">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-ink truncate">
                    {orderForm.editingTicketId
                      ? `Auftrag ${orderForm.editingTicketId} bearbeiten`
                      : "Neuen Auftrag eintragen"}
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    Telefonanfrage, Übergabetermin oder Geräte-/Teilebestellung
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink cursor-pointer shrink-0"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => void handleSaveOrderModal(e)} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
                {/* Service Type & Urgency Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Übergabe-Art
                    </label>
                    <div className="grid grid-cols-2 items-stretch gap-1 p-1 rounded-xl bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15">
                      <button
                        type="button"
                        data-compact-label="true"
                        onClick={() =>
                          setOrderForm({ ...orderForm, visitType: "home_visit" })
                        }
                        className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-lg text-xs font-bold leading-tight text-center inline-flex items-center justify-center transition-colors cursor-pointer ${
                          orderForm.visitType === "home_visit"
                            ? "bg-primary text-white dark:bg-white dark:text-slate-900 shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Lieferung vor Ort
                      </button>
                      <button
                        type="button"
                        data-compact-label="true"
                        onClick={() =>
                          setOrderForm({ ...orderForm, visitType: "workshop" })
                        }
                        className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-lg text-xs font-bold leading-tight text-center inline-flex items-center justify-center transition-colors cursor-pointer ${
                          orderForm.visitType === "workshop"
                            ? "bg-primary text-white dark:bg-white dark:text-slate-900 shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Lieferung / Übergabe
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Dringlichkeit
                    </label>
                    <div className="grid grid-cols-3 items-stretch gap-1 p-1 rounded-xl bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15">
                      {(["normal", "express", "notfall"] as const).map((urg) => (
                        <button
                          key={urg}
                          type="button"
                          data-compact-label="true"
                          onClick={() => setOrderForm({ ...orderForm, urgency: urg })}
                          className={`min-h-[44px] px-2 sm:px-2.5 py-2 rounded-lg text-xs font-bold leading-tight text-center inline-flex items-center justify-center transition-colors cursor-pointer ${
                            orderForm.urgency === urg
                              ? urg === "notfall"
                                ? "bg-red-600 text-white shadow-xs"
                                : urg === "express"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-primary text-white dark:bg-white dark:text-slate-900 shadow-xs"
                              : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          {ADMIN_URGENCY_META[urg].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Kundenname *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.name}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, name: e.target.value })
                      }
                      placeholder="z. B. Frau Meyer"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderForm.phone}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, phone: e.target.value })
                      }
                      placeholder="z. B. 0541 123456"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Gerät
                    </label>
                    <select
                      value={orderForm.device}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, device: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    >
                      {deviceTypes.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Marke
                    </label>
                    <select
                      value={orderForm.brand}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, brand: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    >
                      {popularBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Modell / E-Nr. (optional)
                    </label>
                    <input
                      type="text"
                      value={orderForm.model}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, model: e.target.value })
                      }
                      placeholder="z. B. W1 / Serie 6"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Was ist defekt? (Fehlerbeschreibung)
                  </label>
                  <input
                    type="text"
                    value={orderForm.problem}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, problem: e.target.value })
                    }
                    placeholder="z. B. Pumpt nicht ab, Fehler F11"
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  />
                </div>

                {orderForm.visitType === "home_visit" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        PLZ / Einsatzort
                      </label>
                      <select
                        value={orderForm.zip}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, zip: e.target.value })
                        }
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                      >
                        {osnabrueckServiceAreas.map((area) => (
                          <option key={area.value} value={area.value}>
                            {area.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Straße &amp; Hausnummer
                      </label>
                      <input
                        type="text"
                        value={orderForm.streetAddress}
                        onChange={(e) =>
                          setOrderForm({
                            ...orderForm,
                            streetAddress: e.target.value,
                          })
                        }
                        placeholder="z. B. Iburger Str. 20"
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Termin-Datum
                    </label>
                    <input
                      type="date"
                      value={orderForm.scheduledDate}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          scheduledDate: e.target.value,
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Uhrzeit
                    </label>
                    <select
                      value={orderForm.scheduledSlot}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          scheduledSlot: e.target.value as AdminTimeSlot,
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    >
                      {ADMIN_TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Preis (€ optional)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={orderForm.totalGross}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, totalGross: e.target.value })
                      }
                      placeholder="z. B. 89"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Notiz / Durchgeführte Arbeit (optional)
                  </label>
                  <input
                    type="text"
                    value={orderForm.technicianNotes}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        technicianNotes: e.target.value,
                      })
                    }
                    placeholder="z. B. Laugenpumpe gereinigt, Ersatzteil eingebaut…"
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  />
                </div>
                </div>

                <div className="shrink-0 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="min-h-[44px] px-4 py-2.5 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm cursor-pointer"
                  >
                    {orderForm.editingTicketId
                      ? "Änderungen speichern"
                      : "Auftrag speichern"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Sold ("Verkauft") or Service ("Service / Garantie") & Save on Website */}
        {completionModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Auftrag als verkauft oder Service bestätigen"
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-primary/10 dark:border-white/10 shrink-0 bg-surface dark:bg-slate-900">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-ink truncate">
                    Abschluss bestätigen ({completionModal.ticket.id})
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    Dauerhaft gespeichert &amp; schließt den Auftrag ab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletionModal(null)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink cursor-pointer shrink-0"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => void handleConfirmCompletion(e)}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
                {/* Outcome Picker: Sold vs Repaired */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-2">
                    Was möchten Sie bestätigen?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCompletionModal((prev) => {
                          if (!prev) return null;
                          const nextWarranty =
                            prev.warrantyMonths === 6 ? 12 : prev.warrantyMonths;
                          return {
                            ...prev,
                            outcome: "sold",
                            warrantyMonths: nextWarranty,
                            workOrSaleSummary: prev.hasCustomSummary
                              ? prev.workOrSaleSummary
                              : buildCompletionSummaryTemplate(
                                  prev.ticket,
                                  "sold",
                                  nextWarranty
                                ),
                          };
                        })
                      }
                      className={`h-full min-h-[88px] flex flex-col justify-between px-3.5 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        completionModal.outcome === "sold"
                          ? "border-primary bg-primary text-white shadow-sm dark:border-accent"
                          : "border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 text-ink hover:border-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-extrabold text-sm">
                        <ShoppingBag
                          className={`w-4 h-4 shrink-0 ${
                            completionModal.outcome === "sold"
                              ? "text-accent"
                              : "text-primary dark:text-accent"
                          }`}
                        />
                        <span>Gerät / Teil verkauft</span>
                      </div>
                      <p
                        className={`mt-1 text-xs ${
                          completionModal.outcome === "sold"
                            ? "text-white/80"
                            : "text-ink-muted"
                        }`}
                      >
                        Verkauf inkl. Übergabe &amp; schriftlicher Garantie bestätigen
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCompletionModal((prev) => {
                          if (!prev) return null;
                          const nextWarranty =
                            prev.warrantyMonths === 12 ? 6 : prev.warrantyMonths;
                          return {
                            ...prev,
                            outcome: "repaired",
                            warrantyMonths: nextWarranty,
                            workOrSaleSummary: prev.hasCustomSummary
                              ? prev.workOrSaleSummary
                              : buildCompletionSummaryTemplate(
                                  prev.ticket,
                                  "repaired",
                                  nextWarranty
                                ),
                          };
                        })
                      }
                      className={`h-full min-h-[88px] flex flex-col justify-between px-3.5 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        completionModal.outcome === "repaired"
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 text-ink hover:border-emerald-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-extrabold text-sm">
                        <Wrench className="w-4 h-4 shrink-0" />
                        <span>Übergabe / Garantieabwicklung</span>
                      </div>
                      <p
                        className={`mt-1 text-xs ${
                          completionModal.outcome === "repaired"
                            ? "text-white/85"
                            : "text-ink-muted"
                        }`}
                      >
                        Original-Ersatzteil übergeben oder Hannachi-Garantiefall abgeschlossen
                      </p>
                    </button>
                  </div>
                </div>

                {/* Optional Marketplace Inventory Linking when outcome === "sold" */}
                {completionModal.outcome === "sold" && marketplaceItems.length > 0 && (
                  <div className="rounded-xl border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 p-3 space-y-1.5">
                    <label
                      htmlFor="completion-marketplace-link"
                      className="block text-xs font-bold text-ink"
                    >
                      Marktplatz-Artikel verknüpfen (optional, wird auf „Verkauft“ gesetzt):
                    </label>
                    <select
                      id="completion-marketplace-link"
                      value={completionModal.selectedMarketplaceItemId}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        const found = marketplaceItems.find((i) => i.id === chosenId);
                        setCompletionModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                selectedMarketplaceItemId: chosenId,
                                partsOrSerial:
                                  !prev.partsOrSerial && found?.skuOrEnr
                                    ? found.skuOrEnr
                                    : prev.partsOrSerial,
                              }
                            : null
                        );
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-xs font-semibold text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="">
                        Kein Marktplatz-Artikel (nur Handelsbeleg)
                      </option>
                      {marketplaceItems
                        .filter(
                          (m) =>
                            !isMarketplaceItemSold(m) ||
                            m.id === completionModal.selectedMarketplaceItemId
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.brand} · {m.title} ({m.skuOrEnr})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-semibold text-ink">
                      {completionModal.outcome === "sold"
                        ? "Verkaufter Artikel & Übergabe-Details *"
                        : "Teileübergabe / Hannachi-Garantie-Details *"}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCompletionModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                hasCustomSummary: false,
                                workOrSaleSummary: buildCompletionSummaryTemplate(
                                  prev.ticket,
                                  prev.outcome,
                                  prev.warrantyMonths
                                ),
                              }
                            : null
                        )
                      }
                      className="text-xs font-bold text-accent-hover dark:text-accent hover:underline cursor-pointer"
                    >
                      Vorlage neu einfügen
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={completionModal.workOrSaleSummary}
                    onChange={(e) =>
                      setCompletionModal({
                        ...completionModal,
                        hasCustomSummary: true,
                        workOrSaleSummary: e.target.value,
                      })
                    }
                    placeholder={
                      completionModal.outcome === "sold"
                        ? "z. B. Miele W1 übergeben, Lieferung nach Termin, inkl. 12 Monate Verkäufergarantie"
                        : "z. B. Original-Ersatzteil nach E-Nr. übergeben oder Garantiefall für bei Hannachi gekauftes Gerät erledigt"
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink focus:outline-none focus:border-accent"
                  />
                  {/* 1-Tap Quick Append Phrases to minimize typing */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(completionModal.outcome === "sold"
                      ? [
                          "Inkl. schriftl. Garantiebeleg",
                          "Im Lager funktionsgeprüft",
                          "Persönliche Übergabe",
                          "Lieferung nach Termin",
                        ]
                      : [
                          "Original-Ersatzteil übergeben",
                          "Typenschild (E-Nr.) abgeglichen",
                          "Garantiefall (Hannachi-Kauf)",
                          "Austauschgerät übergeben",
                        ]
                    ).map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() =>
                          setCompletionModal((prev) => {
                            if (!prev) return null;
                            if (prev.workOrSaleSummary.includes(phrase)) return prev;
                            const sep = prev.workOrSaleSummary.trim().endsWith(".")
                              ? " "
                              : " · ";
                            return {
                              ...prev,
                              hasCustomSummary: true,
                              workOrSaleSummary: prev.workOrSaleSummary.trim()
                                ? `${prev.workOrSaleSummary.trim()}${sep}${phrase}.`
                                : `${phrase}.`,
                            };
                          })
                        }
                        className="min-h-[34px] px-2.5 py-1 rounded-md border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 hover:border-accent text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
                      >
                        + {phrase}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      E-Nr. / Serien-Nr. / Ersatzteil
                    </label>
                    <input
                      type="text"
                      value={completionModal.partsOrSerial}
                      onChange={(e) =>
                        setCompletionModal({
                          ...completionModal,
                          partsOrSerial: e.target.value,
                        })
                      }
                      placeholder="z. B. E-Nr. WDB030WCS / Pumpe 00651956"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Endbetrag inkl. MwSt. (€)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={completionModal.finalGrossInput}
                      onChange={(e) =>
                        setCompletionModal({
                          ...completionModal,
                          finalGrossInput: e.target.value,
                        })
                      }
                      placeholder="z. B. 149"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono font-bold text-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Garantie / Gewährleistung
                    </label>
                    <select
                      value={completionModal.warrantyMonths}
                      onChange={(e) => {
                        const nextWarranty = Number(e.target.value) || 0;
                        setCompletionModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                warrantyMonths: nextWarranty,
                                workOrSaleSummary: prev.hasCustomSummary
                                  ? prev.workOrSaleSummary
                                  : buildCompletionSummaryTemplate(
                                      prev.ticket,
                                      prev.outcome,
                                      nextWarranty
                                    ),
                              }
                            : null
                        );
                      }}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    >
                      <option value={12}>12 Monate schriftliche Garantie</option>
                      <option value={24}>24 Monate Garantie / Gewährleistung</option>
                      <option value={6}>6 Monate Funktionsgarantie</option>
                      <option value={0}>Ohne gesonderte Garantiezeit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Bestätigt durch
                    </label>
                    <input
                      type="text"
                      value={completionModal.confirmedBy}
                      onChange={(e) =>
                        setCompletionModal({
                          ...completionModal,
                          confirmedBy: e.target.value,
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                    />
                  </div>
                </div>
                </div>

                <div className="shrink-0 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCompletionModal(null)}
                    className="min-h-[44px] px-4 py-2.5 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={savingCompletion}
                    data-testid="confirm-completion-save-btn"
                    className="min-h-[44px] flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <BadgeCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {savingCompletion
                        ? "Wird gespeichert…"
                        : "Speichern & Abschließen"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Customer History Drawer (All orders & total turnover for a phone number) */}
        {customerHistoryPhone && (() => {
          const histTickets = ticketsByPhone.get(customerHistoryPhone) || [];
          const primaryTicket = histTickets[0];
          const totalRevenue = histTickets.reduce((sum, item) => {
            const totals = calculateTicketTotals(
              resolveTicketWithDraft(item).invoiceItems || []
            );
            return sum + totals.grossTotal;
          }, 0);

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Kundenhistorie und bisherige Aufträge"
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <div className="bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-primary/10 dark:border-white/10 shrink-0">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-accent uppercase tracking-wide">
                      Kundenakte &amp; Auftragsverlauf
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-ink mt-0.5 truncate">
                      {primaryTicket?.name || "Kunde"} ·{" "}
                      <span className="font-mono text-sm text-ink-muted">
                        {primaryTicket?.phone || customerHistoryPhone}
                      </span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerHistoryPhone(null)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink cursor-pointer shrink-0"
                    aria-label="Schließen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
                  {/* Customer Summary Stats */}
                  <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-background dark:bg-slate-950 p-3.5 text-center">
                    <div>
                      <div className="text-[11px] font-semibold text-ink-muted">
                        Aufträge gesamt
                      </div>
                      <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
                        {histTickets.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-ink-muted">
                        Abgeschlossen
                      </div>
                      <div className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {
                          histTickets.filter(
                            (t) => normalizeSimpleStatus(t.status) === "completed"
                          ).length
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-ink-muted">
                        Gesamtumsatz
                      </div>
                      <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
                        {totalRevenue > 0 ? formatEuro(totalRevenue) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Chronological List */}
                  <div className="space-y-2.5">
                    {histTickets.map((ht) => {
                      const st = normalizeSimpleStatus(ht.status);
                      const totals = calculateTicketTotals(
                        resolveTicketWithDraft(ht).invoiceItems || []
                      );
                      const dev = ht.device.includes("Anderes")
                        ? ht.customDevice || "Hausgerät"
                        : ht.device;

                      return (
                        <div
                          key={ht.id}
                          className="rounded-xl border border-primary/12 dark:border-white/10 bg-background dark:bg-slate-950 p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 font-mono">
                              <span className="font-bold text-ink">{ht.id}</span>
                              <span className="text-ink-muted">
                                {new Date(ht.createdAt).toLocaleDateString("de-DE")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-sans font-bold text-[11px] ${
                                  st === "completed"
                                    ? "bg-emerald-600 text-white"
                                    : st === "in_progress"
                                    ? "bg-amber-600 text-white"
                                    : "bg-sky-600 text-white"
                                }`}
                              >
                                {st === "completed"
                                  ? ht.completionDetails?.outcome === "sold"
                                    ? "Verkauft"
                                    : "Erledigt"
                                  : st === "in_progress"
                                  ? "In Arbeit"
                                  : "Neu"}
                              </span>
                            </div>
                            <span className="font-mono font-extrabold text-ink tabular-nums">
                              {totals.grossTotal > 0 ? formatEuro(totals.grossTotal) : "Ohne Betrag"}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm font-bold text-ink">
                            {ht.brand} · {dev}
                            {ht.model ? ` (${ht.model})` : ""}
                          </div>
                          <p className="text-xs text-ink-muted">
                            {ht.completionDetails?.workOrSaleSummary || ht.problem}
                          </p>

                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerHistoryPhone(null);
                                handleOpenPrintPreview(ht);
                              }}
                              className="min-h-[34px] px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Beleg exportieren</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerHistoryPhone(null);
                                setActiveTab("orders");
                                setStatusFilter("all");
                                setScopeFilter("all");
                                setSearchQuery(ht.id);
                                setExpandedDetailsIds((prev) => ({
                                  ...prev,
                                  [ht.id]: true,
                                }));
                              }}
                              className="min-h-[34px] px-3 py-1 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-bold text-ink hover:border-accent inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Auftrag öffnen</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 3. INTERACTIVE TICKET EXPORT & PRINT STUDIO (PC + Smartphone) ── */}
      {printTickets.length > 0 && (
        <div
          className={
            isPrintPreviewOpen
              ? "fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs overflow-y-auto p-3 sm:p-8 print:static print:bg-white print:p-0 print:overflow-visible"
              : "hidden print:block bg-white text-slate-900"
          }
        >
          {/* Screen-Only Pro Export Toolbar (Hidden during actual print) */}
          {isPrintPreviewOpen && (
            <div className="print:hidden max-w-3xl mx-auto mb-4 bg-primary text-white rounded-xl p-4 shadow-xl border border-white/15 space-y-3 sticky top-2 z-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm sm:text-base font-extrabold">
                    Ticket Export &amp; Beleg-Vorschau ({printTickets.length}{" "}
                    {printTickets.length === 1 ? "Auftrag" : "Aufträge"})
                  </div>
                  <div className="text-xs text-white/75 mt-0.5">
                    Als Bild (PNG), PDF/Druck, HTML-Beleg, Excel-CSV oder direkt per Handy-Teilen exportieren.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Schließen</span>
                </button>
              </div>

              {/* Document Type Selector (Auftragsbeleg vs Kauf- & Garantiebeleg) */}
              <div className="grid grid-cols-2 items-stretch gap-1 p-1 rounded-xl bg-white/10">
                <button
                  type="button"
                  data-compact-label="true"
                  onClick={() => setTicketDocType("service")}
                  className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-lg text-xs font-bold leading-tight text-center inline-flex items-center justify-center transition-colors cursor-pointer ${
                    ticketDocType === "service"
                      ? "bg-white text-primary shadow-xs"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Auftrags- &amp; Servicebeleg
                </button>
                <button
                  type="button"
                  data-compact-label="true"
                  onClick={() => setTicketDocType("warranty_sale")}
                  className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-lg text-xs font-bold leading-tight text-center inline-flex items-center justify-center transition-colors cursor-pointer ${
                    ticketDocType === "warranty_sale"
                      ? "bg-accent text-primary shadow-xs"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Kauf- &amp; Garantiebeleg
                </button>
              </div>

              {/* Multi-Format Export Action Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Drucken / PDF</span>
                </button>

                {printTickets.length === 1 && (
                  <>
                    <button
                      type="button"
                      disabled={exportBusy}
                      onClick={async () => {
                        setExportBusy(true);
                        const ok = await exportTicketAsPng(
                          printTickets[0],
                          ticketDocType
                        );
                        setExportBusy(false);
                        showToast(
                          ok
                            ? `Ticket ${printTickets[0].id} als Bild (PNG) gespeichert`
                            : "PNG-Export fehlgeschlagen"
                        );
                      }}
                      data-testid="export-ticket-png-btn"
                      className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <ImageDown className="w-4 h-4 shrink-0" />
                      <span>Als Bild (PNG)</span>
                    </button>

                    <button
                      type="button"
                      disabled={exportBusy}
                      onClick={async () => {
                        setExportBusy(true);
                        const res = await shareTicketNative(
                          printTickets[0],
                          ticketDocType
                        );
                        setExportBusy(false);
                        showToast(
                          res === "shared"
                            ? "Ticket zum Teilen geöffnet"
                            : "Ticket-Bild gespeichert (bereit zum Versenden)"
                        );
                      }}
                      data-testid="share-ticket-mobile-btn"
                      className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>Teilen (Handy)</span>
                    </button>

                    <a
                      href={buildAdminWhatsAppReplyUrl(
                        printTickets[0],
                        ticketDocType === "warranty_sale" ? "sold_thanks" : "price_estimate"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>Per WhatsApp senden</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const txt = formatTicketTextSummary(
                          printTickets[0],
                          ticketDocType
                        );
                        void handleCopyText(txt, "Ticket-Text");
                      }}
                      className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-white/25 hover:bg-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>Text kopieren</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    downloadPrintableReceiptsHtml(printTickets, ticketDocType);
                    showToast("HTML-Druckbeleg heruntergeladen");
                  }}
                  className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border border-white/25 hover:bg-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>HTML-Beleg</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportTicketsToCsv(printTickets);
                    showToast("Excel / CSV exportiert");
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Excel / CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* DIN A4 Receipt Sheets (Phone-Responsive Preview + Print-Accurate Sheet) */}
          {printTickets.map((printTicket, index) => {
            const totals = calculateTicketTotals(printTicket.invoiceItems || []);
            const isLast = index === printTickets.length - 1;
            const originUrl =
              typeof window !== "undefined" && window.location.origin
                ? window.location.origin
                : business.url;
            const ticketLookupUrl = `${originUrl}/admin?ticket=${encodeURIComponent(
              printTicket.id
            )}`;
            const isWarrantyDoc = ticketDocType === "warranty_sale";

            return (
              <div
                key={printTicket.id}
                className={`bg-white text-slate-900 p-4 sm:p-10 max-w-3xl mx-auto text-sm rounded-xl shadow-xl mb-6 print:shadow-none print:rounded-none print:mb-0 print:p-8 ${
                  !isLast ? "print:break-after-page" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b-2 border-slate-900">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                      {business.name}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      Inhaber: {business.owner} · {business.street},{" "}
                      {business.zip} {business.city}
                    </p>
                    <p className="text-xs text-slate-600">
                      Tel.: {business.phoneDisplay} · {business.email}
                    </p>
                  </div>
                  <div className="flex items-start justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0">
                    <div className="text-left sm:text-right print:text-right font-mono text-xs tabular-nums">
                      <div className="font-bold text-sm">
                        {isWarrantyDoc
                          ? "KAUF- & GARANTIEBELEG"
                          : "HANDELS- & ÜBERGABEBELEG"}
                      </div>
                      <div className="mt-1">Auftrags-Nr.: {printTicket.id}</div>
                      <div>Beleg-Nr.: {printTicket.invoiceNumber}</div>
                      <div>Datum: {new Date().toLocaleDateString("de-DE")}</div>
                    </div>
                    <div className="flex flex-col items-center border border-slate-300 rounded p-1.5 bg-white shrink-0">
                      <QRCodeSVG
                        value={ticketLookupUrl}
                        size={60}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#0F172A"
                      />
                      <span className="mt-1 font-mono text-[9px] text-slate-600 tabular-nums leading-none">
                        {printTicket.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-5 sm:gap-6 py-5 sm:py-6 border-b border-slate-300">
                  <div>
                    <div className="text-xs font-bold text-slate-500">KUNDENDATEN</div>
                    <div className="mt-1 font-bold text-base">{printTicket.name}</div>
                    {printTicket.streetAddress && <div>{printTicket.streetAddress}</div>}
                    <div>{printTicket.zip.replace(" (Werkstatt)", "")}</div>
                    <div className="mt-1 font-mono">Tel.: {printTicket.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500">GERÄT &amp; TERMIN</div>
                    <div className="mt-1 font-bold">
                      {printTicket.brand} ·{" "}
                      {printTicket.device.includes("Anderes")
                        ? printTicket.customDevice || "Hausgerät"
                        : printTicket.device}
                    </div>
                    {printTicket.model && <div>Modell / E-Nr.: {printTicket.model}</div>}
                    <div className="mt-0.5 text-slate-600">
                      Übergabe-Art:{" "}
                      {printTicket.visitType === "home_visit"
                        ? "Lieferung / Übergabe vor Ort"
                        : "Übergabe nach Termin"}
                    </div>
                    <div className="mt-0.5">
                      Termin:{" "}
                      {printTicket.scheduledDate
                        ? new Date(
                            `${printTicket.scheduledDate}T12:00:00`
                          ).toLocaleDateString("de-DE")
                        : "Nach Vereinbarung"}{" "}
                      ({printTicket.scheduledSlot})
                    </div>
                  </div>
                </div>

                <div className="py-5 border-b border-slate-300">
                  <div className="text-xs font-bold text-slate-500">
                    {isWarrantyDoc
                      ? "GERÄTEDATEN / ÜBERGABE & GARANTIEHINWEIS"
                      : "ANLIEGEN / ÜBERGABE & NOTIZEN"}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    <strong>Kundenangabe:</strong> {printTicket.problem}
                  </p>
                  {printTicket.completionDetails && (
                    <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                      <strong>
                        Bestätigter Abschluss (
                        {printTicket.completionDetails.outcome === "sold"
                          ? "Verkauft"
                          : "Garantie- / Übergabevorgang"}
                        ):
                      </strong>{" "}
                      {printTicket.completionDetails.workOrSaleSummary}
                      {printTicket.completionDetails.warrantyMonths > 0
                        ? ` · ${printTicket.completionDetails.warrantyMonths} Monate Garantie`
                        : ""}
                    </p>
                  )}
                  {printTicket.completionDetails?.partsOrSerial && (
                    <p className="mt-1 text-sm font-mono">
                      <strong>Teile / E-Nr.:</strong>{" "}
                      {printTicket.completionDetails.partsOrSerial}
                    </p>
                  )}
                  {!printTicket.completionDetails && printTicket.technicianNotes && (
                    <p className="mt-2 text-sm leading-relaxed">
                      <strong>Durchgeführte Arbeit / Notiz:</strong>{" "}
                      {printTicket.technicianNotes}
                    </p>
                  )}
                </div>

                <div className="py-5 sm:py-6 border-b border-slate-300">
                  <div className="flex justify-between items-center py-1 text-sm">
                    <span>Nettobetrag:</span>
                    <span className="font-mono tabular-nums">
                      {totals.grossTotal > 0 ? formatEuro(totals.netTotal) : "__________ €"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-sm">
                    <span>zzgl. 19 % MwSt.:</span>
                    <span className="font-mono tabular-nums">
                      {totals.grossTotal > 0
                        ? formatEuro(totals.vatAmount)
                        : "__________ €"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-900 text-base font-bold">
                    <span>Gesamtbetrag (inkl. MwSt.):</span>
                    <span className="font-mono tabular-nums">
                      {totals.grossTotal > 0
                        ? formatEuro(totals.grossTotal)
                        : "__________ €"}
                    </span>
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 text-xs text-slate-600 space-y-6">
                  <p>
                    {isWarrantyDoc
                      ? "Schriftliche Verkäufergarantie gemäß Kaufbeleg für direkt bei Hannachi Elektrohaushaltsgeräte & Ersatzteile erworbene Geräte. Handelsgewerbe nach § 14 GewO (kein Handwerks- oder Meisterbetrieb)."
                      : "Dokumentiert durch Hannachi Elektrohaushaltsgeräte & Ersatzteile · Iburger Straße 5, 49082 Osnabrück (Handelsgewerbe nach § 14 GewO, kein Handwerksbetrieb). Vielen Dank für Ihr Vertrauen!"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 sm:gap-12 pt-6 sm:pt-8">
                    <div className="border-t border-slate-400 pt-1">
                      {isWarrantyDoc
                        ? "Datum / Unterschrift Verkäufer (Hannachi)"
                        : "Datum / Unterschrift Hannachi Fachhandel"}
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      {isWarrantyDoc
                        ? "Datum / Unterschrift Käufer"
                        : "Datum / Unterschrift Kunde"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
