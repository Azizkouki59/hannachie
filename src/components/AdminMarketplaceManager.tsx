"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  Package,
  X,
  Check,
  ShieldCheck,
  Upload,
  Camera,
  Star,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Image as ImageIcon,
  EyeOff,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  INITIAL_MARKETPLACE_DEMO_ITEMS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_QUICK_PRESETS,
  loadLocalMarketplaceItems,
  loadLocalMarketplaceSettings,
  saveLocalMarketplaceItems,
  saveLocalMarketplaceSettings,
  resolveMarketplaceItemGallery,
  type MarketplaceCategoryId,
  type MarketplaceItem,
  type MarketplaceAvailabilityStatus,
  type MarketplacePhoto,
  type MarketplaceSettings,
  type MarketplaceQuickPreset,
} from "@/data/marketplaceItems";
import {
  buildSingleGrossInvoiceItems,
  type AdminRepairTicket,
  type TicketCompletionDetails,
} from "@/lib/adminTypes";
import { resolveCoordinatesForZip } from "@/lib/adminClient";
import {
  compressImageFileForUpload,
  formatBytesCompact,
} from "@/lib/imageUpload";

type FormState = {
  id: string;
  category: Exclude<MarketplaceCategoryId, "all">;
  conditionType: "refurbished" | "new_part";
  brand: string;
  skuOrEnr: string;
  title: string;
  shortSpecs: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  availability: MarketplaceAvailabilityStatus;
  photos: MarketplacePhoto[];
};

const EMPTY_FORM: FormState = {
  id: "",
  category: "washing_drying",
  conditionType: "refurbished",
  brand: "Miele",
  skuOrEnr: "E-Nr. auf Typenschild",
  title: "",
  shortSpecs: "8 kg Fassungsvermögen · 1400 U/min · Geprüft",
  bullet1: "Komplett geprüft, gereinigt und Verschleißteile kontrolliert",
  bullet2: "Inkl. schriftlicher Verkäufergarantie auf dem Kaufbeleg",
  bullet3: "Sofort abholbereit in 49082 Osnabrück (Iburger Straße 5)",
  availability: "Sofort verfügbar in Osnabrück",
  photos: [],
};

const PHOTO_LABEL_PRESETS = [
  "Frontansicht",
  "Typenschild (E-Nr.)",
  "Anschluss / Detail",
  "Innenraum / Trommel",
  "Zubehör",
];

const MAX_PHOTOS_PER_ITEM = 12;

export default function AdminMarketplaceManager({
  adminToken,
  onToast,
  onMarketplaceSaleTicketCreated,
  onItemsChanged,
}: {
  adminToken: string;
  onToast?: (msg: string) => void;
  onMarketplaceSaleTicketCreated?: (
    ticket: AdminRepairTicket,
    openExport?: boolean
  ) => void;
  onItemsChanged?: (items: MarketplaceItem[]) => void;
}) {
  const [items, setItems] = useState<MarketplaceItem[]>(() =>
    loadLocalMarketplaceItems()
  );
  const [mpSettings, setMpSettings] = useState<MarketplaceSettings>(() =>
    loadLocalMarketplaceSettings()
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryCat, setInventoryCat] = useState<MarketplaceCategoryId>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Quick-Sale Modal ("Verkauft & Kaufbeleg erstellen")
  const [soldModal, setSoldModal] = useState<{
    item: MarketplaceItem;
    createTicket: boolean;
    buyerName: string;
    buyerPhone: string;
    grossPriceInput: string;
    warrantyMonths: number;
    openExportAfter: boolean;
  } | null>(null);
  const [savingSoldModal, setSavingSoldModal] = useState<boolean>(false);

  // Multi-photo upload & drag state
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    statusText: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const syncFromApi = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        items?: MarketplaceItem[];
        settings?: MarketplaceSettings;
      };
      if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        saveLocalMarketplaceItems(data.items);
        onItemsChanged?.(data.items);
      }
      if (data.ok && data.settings) {
        setMpSettings(data.settings);
        saveLocalMarketplaceSettings(data.settings);
      }
    } catch {
      // Fallback to localStorage
    }
  }, [onItemsChanged]);

  useEffect(() => {
    syncFromApi();
    const onUpdated = (e: Event) => {
      const custom = e as CustomEvent<MarketplaceItem[]>;
      if (Array.isArray(custom.detail)) {
        setItems(custom.detail);
      } else {
        setItems(loadLocalMarketplaceItems());
      }
    };
    window.addEventListener("hannachi:marketplace-updated", onUpdated);
    return () =>
      window.removeEventListener("hannachi:marketplace-updated", onUpdated);
  }, [syncFromApi]);

  const openCreateModal = () => {
    setUploadError(null);
    setUploadProgress(null);
    setForm({
      ...EMPTY_FORM,
      id: "",
      photos: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MarketplaceItem) => {
    setUploadError(null);
    setUploadProgress(null);
    setForm({
      id: item.id,
      category: item.category,
      conditionType: item.conditionType,
      brand: item.brand,
      skuOrEnr: item.skuOrEnr,
      title: item.title,
      shortSpecs: item.shortSpecs,
      bullet1: item.bulletSpecs[0] || "",
      bullet2: item.bulletSpecs[1] || "",
      bullet3: item.bulletSpecs[2] || "",
      availability: item.availability,
      photos: Array.isArray(item.photos) ? [...item.photos] : [],
    });
    setIsModalOpen(true);
  };

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (incoming.length === 0) {
      setUploadError("Bitte nur gültige Bilddateien (JPG, PNG, WebP) auswählen.");
      return;
    }

    const availableSlots = Math.max(0, MAX_PHOTOS_PER_ITEM - form.photos.length);
    if (availableSlots === 0) {
      setUploadError(
        `Maximal ${MAX_PHOTOS_PER_ITEM} Fotos pro Angebot möglich.`
      );
      return;
    }

    const batch = incoming.slice(0, availableSlots);
    setUploadError(null);
    const uploadedPhotos: MarketplacePhoto[] = [];
    let savedBytesTotal = 0;

    for (let idx = 0; idx < batch.length; idx++) {
      const file = batch[idx];
      setUploadProgress({
        current: idx + 1,
        total: batch.length,
        statusText: `Foto ${idx + 1} von ${batch.length} wird optimiert & hochgeladen...`,
      });

      try {
        const compressed = await compressImageFileForUpload(file, {
          maxEdge: 1400,
          quality: 0.82,
        });
        savedBytesTotal += Math.max(
          0,
          compressed.originalBytes - compressed.compressedBytes
        );

        const defaultLabel =
          form.photos.length + uploadedPhotos.length === 0
            ? "Frontansicht"
            : undefined;

        let addedPhoto: MarketplacePhoto | null = null;
        try {
          const res = await fetch("/api/admin/marketplace/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
            },
            body: JSON.stringify({
              dataUrl: compressed.dataUrl,
              label: defaultLabel,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              ok?: boolean;
              photo?: MarketplacePhoto;
            };
            if (data.ok && data.photo) {
              addedPhoto = data.photo;
            }
          }
        } catch {
          // Offline fallback below
        }

        if (!addedPhoto) {
          addedPhoto = {
            id: `local-${Date.now().toString(36)}-${idx}`,
            url: compressed.dataUrl,
            ...(defaultLabel ? { label: defaultLabel } : {}),
          };
        }

        uploadedPhotos.push(addedPhoto);
      } catch {
        setUploadError(
          `Ein Bild (${file.name}) konnte nicht verarbeitet werden.`
        );
      }
    }

    if (uploadedPhotos.length > 0) {
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos].slice(0, MAX_PHOTOS_PER_ITEM),
      }));
      const savedNote =
        savedBytesTotal > 1024
          ? ` (${formatBytesCompact(savedBytesTotal)} komprimiert)`
          : "";
      onToast?.(
        `${uploadedPhotos.length} ${
          uploadedPhotos.length === 1 ? "Foto" : "Fotos"
        } hinzugefügt${savedNote}`
      );
    }

    setUploadProgress(null);
  };

  const handleSetPrimaryPhoto = (photoIndex: number) => {
    if (photoIndex <= 0 || photoIndex >= form.photos.length) return;
    setForm((prev) => {
      const next = [...prev.photos];
      const [chosen] = next.splice(photoIndex, 1);
      return { ...prev, photos: [chosen, ...next] };
    });
  };

  const handleMovePhoto = (photoIndex: number, direction: -1 | 1) => {
    const targetIndex = photoIndex + direction;
    if (targetIndex < 0 || targetIndex >= form.photos.length) return;
    setForm((prev) => {
      const next = [...prev.photos];
      const [item] = next.splice(photoIndex, 1);
      next.splice(targetIndex, 0, item);
      return { ...prev, photos: next };
    });
  };

  const handleUpdatePhotoLabel = (photoId: string, label: string) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.map((p) =>
        p.id === photoId ? { ...p, label: label.slice(0, 60) } : p
      ),
    }));
  };

  const handleDeletePhoto = async (photo: MarketplacePhoto) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photo.id),
    }));

    if (photo.url.startsWith("/uploads/")) {
      const filename = photo.url.split("/").pop();
      if (filename) {
        try {
          await fetch(
            `/api/admin/marketplace/upload/${encodeURIComponent(filename)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
              },
            }
          );
        } catch {
          // Ignore server cleanup error
        }
      }
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIsSaving(true);

    const cleanedPhotos = form.photos.map((p) =>
      p.label && p.label.trim().length > 0
        ? { id: p.id, url: p.url, label: p.label.trim() }
        : { id: p.id, url: p.url }
    );

    const payload = {
      id: form.id || undefined,
      category: form.category,
      conditionType:
        form.category === "spare_parts" ? "new_part" : form.conditionType,
      brand: form.brand.trim() || "Miele",
      skuOrEnr: form.skuOrEnr.trim() || "Auf Anfrage",
      title: form.title.trim(),
      shortSpecs: form.shortSpecs.trim(),
      bulletSpecs: [
        form.bullet1.trim() || form.shortSpecs.trim(),
        form.bullet2.trim() || "Geprüfte Markenqualität aus Osnabrück",
        form.bullet3.trim() || "Inkl. schriftlicher Verkäufergarantie bei Übergabe vor Ort",
      ],
      availability: form.availability,
      photos: cleanedPhotos,
    };

    try {
      const res = await fetch("/api/admin/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          items?: MarketplaceItem[];
        };
        if (data.ok && Array.isArray(data.items)) {
          setItems(data.items);
          saveLocalMarketplaceItems(data.items);
          setIsModalOpen(false);
          onToast?.(
            form.id
              ? "Marktplatz-Angebot & Fotogalerie aktualisiert"
              : "Neues Marktplatz-Angebot veröffentlicht"
          );
          setIsSaving(false);
          return;
        }
      }
    } catch {
      // Fallback local save below
    }

    // Local fallback save if offline
    const catMeta =
      MARKETPLACE_CATEGORIES.find((c) => c.id === form.category) ||
      MARKETPLACE_CATEGORIES[1];
    const cond =
      form.category === "spare_parts" ? "new_part" : form.conditionType;
    const itemId = form.id || `mp-${Date.now().toString(36)}`;
    const existingItem = items.find((i) => i.id === itemId);
    const fallbackItem: MarketplaceItem = {
      id: itemId,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skuOrEnr: payload.skuOrEnr,
      title: payload.title,
      brand: payload.brand,
      category: form.category,
      categoryLabel: catMeta.label,
      deviceTypeForForm: catMeta.defaultDeviceForForm,
      conditionType: cond,
      conditionBadge:
        cond === "new_part" ? "Neu · Originalteil" : "Geprüft & Aufbereitet",
      warrantyBadge:
        cond === "new_part"
          ? "Geprüfte Passgenauigkeit"
          : "Inkl. schriftlicher Garantie",
      shortSpecs: payload.shortSpecs,
      bulletSpecs: payload.bulletSpecs as [string, string, string],
      detailedSpecs: [
        { label: "Hersteller & Marke", value: payload.brand },
        { label: "E-Nr. / Teilenummer", value: payload.skuOrEnr },
        { label: "Kategorie", value: catMeta.label },
        { label: "Eckdaten", value: payload.shortSpecs },
      ],
      warrantyTerms:
        "Inklusive schriftlicher Verkäufergarantie von Hannachi Elektrohaushaltsgeräte & Ersatzteile in Osnabrück.",
      pickupInfo:
        "Mobiler Vor-Ort-Service & Übergabe in 49082 Osnabrück & Umgebung nach Terminvereinbarung.",
      availability: form.availability,
      priceLabel: "Preis auf Anfrage",
      imageKey: catMeta.defaultImageKey,
      photos: cleanedPhotos,
      searchKeywords: [
        payload.brand.toLowerCase(),
        payload.skuOrEnr.toLowerCase(),
        payload.title.toLowerCase(),
      ],
      inquiryTopic:
        form.category === "spare_parts" ? "spare_parts" : "device_purchase",
      inquiryPreset: `Reservierung / Anfrage: ${payload.title} (${payload.skuOrEnr})`,
    };

    const nextList = form.id
      ? items.map((i) => (i.id === form.id ? fallbackItem : i))
      : [fallbackItem, ...items];
    setItems(nextList);
    saveLocalMarketplaceItems(nextList);
    setIsModalOpen(false);
    setIsSaving(false);
    onToast?.("Marktplatz-Angebot & Fotogalerie gespeichert");
  };

  const handleSetAvailability = async (
    item: MarketplaceItem,
    nextAvailability: MarketplaceAvailabilityStatus,
    linkedTicketId?: string
  ) => {
    const nowIso = new Date().toISOString();
    const optimistic = items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            availability: nextAvailability,
            soldAt:
              nextAvailability === "Verkauft (Abgeschlossen)"
                ? i.soldAt || nowIso
                : undefined,
            linkedTicketId:
              nextAvailability === "Verkauft (Abgeschlossen)"
                ? linkedTicketId || i.linkedTicketId
                : undefined,
          }
        : i
    );
    setItems(optimistic);
    saveLocalMarketplaceItems(optimistic);
    onItemsChanged?.(optimistic);

    try {
      await fetch(`/api/admin/marketplace/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
        },
        body: JSON.stringify({
          availability: nextAvailability,
          ...(linkedTicketId ? { linkedTicketId } : {}),
        }),
      });
    } catch {
      // Keep local update
    }
    onToast?.(`Status geändert: ${nextAvailability}`);
  };

  const handleToggleHideSoldPublicly = async () => {
    const nextSettings: MarketplaceSettings = {
      hideSoldPublicly: !mpSettings.hideSoldPublicly,
    };
    setMpSettings(nextSettings);
    saveLocalMarketplaceSettings(nextSettings);

    try {
      await fetch("/api/admin/marketplace/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
        },
        body: JSON.stringify(nextSettings),
      });
    } catch {
      // Keep local setting
    }
    onToast?.(
      nextSettings.hideSoldPublicly
        ? "Verkaufte Artikel werden auf /marktplatz ausgeblendet"
        : "Verkaufte Artikel bleiben mit Hinweis „Verkauft“ sichtbar"
    );
  };

  const openSoldQuickModal = (item: MarketplaceItem) => {
    setSoldModal({
      item,
      createTicket: true,
      buyerName: "",
      buyerPhone: "",
      grossPriceInput: "",
      warrantyMonths: item.category === "spare_parts" ? 24 : 12,
      openExportAfter: true,
    });
  };

  const handleConfirmSoldModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soldModal) return;
    setSavingSoldModal(true);

    const {
      item,
      createTicket,
      buyerName,
      buyerPhone,
      grossPriceInput,
      warrantyMonths,
      openExportAfter,
    } = soldModal;

    let linkedTicketId: string | undefined;

    if (createTicket) {
      const nowIso = new Date().toISOString();
      const randomId = `HN-${Math.floor(1000 + Math.random() * 9000)}`;
      const parsedGross = parseFloat(grossPriceInput.replace(",", ".").trim());
      const grossVal =
        Number.isFinite(parsedGross) && parsedGross > 0 ? parsedGross : 0;

      const summary = `${item.title} (${item.skuOrEnr}) verkauft und geprüft übergeben.${
        warrantyMonths > 0
          ? ` Inklusive ${warrantyMonths} Monate schriftlicher Verkäufergarantie gemäß Kaufbeleg.`
          : ""
      }`;

      const completionDetails: TicketCompletionDetails = {
        outcome: "sold",
        confirmedAt: nowIso,
        confirmedBy: "Kamal Hannachi",
        workOrSaleSummary: summary,
        partsOrSerial: item.skuOrEnr,
        warrantyMonths,
        finalGrossAmount: grossVal,
        savedToWebsite: true,
        marketplaceItemId: item.id,
        marketplaceItemTitle: item.title,
      };

      const invoiceItems = buildSingleGrossInvoiceItems(grossVal, summary);
      const coords = resolveCoordinatesForZip("49082 Osnabrück", null);

      const fallbackTicket: AdminRepairTicket = {
        id: randomId,
        createdAt: nowIso,
        updatedAt: nowIso,
        inquiryMode: "repair",
        visitType: "workshop",
        device: item.deviceTypeForForm || "Hausgerät",
        customDevice: "",
        brand: item.brand,
        model: item.skuOrEnr,
        problem: `Marktplatz-Verkauf: ${item.title} (${item.skuOrEnr})`,
        urgency: "normal",
        callbackTime: "Vor-Ort-Termin nach Vereinbarung",
        zip: "49082 Osnabrück",
        streetAddress: "Iburger Straße 5, Im Hof",
        mapsLocationUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
        locationVerified: true,
        coordinates: coords,
        name: buyerName.trim() || "Direktkauf / Kunde",
        phone: buyerPhone.trim() || "0541",
        email: "",
        photoName: null,
        marketplaceItemId: item.id,
        marketplaceItemTitle: item.title,
        status: "completed",
        scheduledDate: nowIso.slice(0, 10),
        scheduledSlot: "Nach Vereinbarung",
        technicianNotes: summary,
        invoiceNumber: `RE-${new Date().getFullYear()}-${randomId.replace("HN-", "")}`,
        invoiceItems,
        completionDetails,
      };

      let savedTicket = fallbackTicket;
      try {
        const res = await fetch("/api/admin/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
          },
          body: JSON.stringify({
            id: randomId,
            visitType: "workshop",
            device: fallbackTicket.device,
            brand: item.brand,
            model: item.skuOrEnr,
            problem: fallbackTicket.problem,
            name: fallbackTicket.name,
            phone: fallbackTicket.phone,
            zip: fallbackTicket.zip,
            streetAddress: fallbackTicket.streetAddress,
            status: "completed",
            scheduledDate: fallbackTicket.scheduledDate,
            scheduledSlot: "Nach Vereinbarung",
            technicianNotes: summary,
            totalGross: grossVal,
            invoiceItems,
            completionDetails,
            marketplaceItemId: item.id,
            marketplaceItemTitle: item.title,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { ticket?: AdminRepairTicket };
          if (data.ticket) savedTicket = data.ticket;
        }
      } catch {
        // Use local fallback
      }

      linkedTicketId = savedTicket.id;
      onMarketplaceSaleTicketCreated?.(savedTicket, openExportAfter);
    }

    await handleSetAvailability(
      item,
      "Verkauft (Abgeschlossen)",
      linkedTicketId
    );
    setSavingSoldModal(false);
    setSoldModal(null);
  };

  const applyQuickPreset = (preset: MarketplaceQuickPreset) => {
    setForm((prev) => ({
      ...prev,
      category: preset.category,
      conditionType: preset.conditionType,
      brand: preset.brand,
      title: preset.titleTemplate,
      shortSpecs: preset.shortSpecs,
      bullet1: preset.bullets[0],
      bullet2: preset.bullets[1],
      bullet3: preset.bullets[2],
    }));
  };

  const handleDeleteItem = async (id: string) => {
    const nextList = items.filter((i) => i.id !== id);
    setItems(nextList);
    saveLocalMarketplaceItems(nextList);
    onItemsChanged?.(nextList);

    try {
      await fetch(`/api/admin/marketplace/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
        },
      });
    } catch {
      // Keep local update
    }
    onToast?.("Angebot aus dem Marktplatz entfernt");
  };

  const handleResetFiveDemos = async () => {
    setItems(INITIAL_MARKETPLACE_DEMO_ITEMS);
    saveLocalMarketplaceItems(INITIAL_MARKETPLACE_DEMO_ITEMS);
    onItemsChanged?.(INITIAL_MARKETPLACE_DEMO_ITEMS);
    try {
      await fetch("/api/admin/marketplace/reset-demos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken || "hannachi-admin-demo-token-49082"}`,
        },
      });
    } catch {
      // Keep local update
    }
    onToast?.("5 Standard-Kategorie-Demos (1 je Kategorie) wiederhergestellt");
  };

  const filteredInventory = items.filter((item) => {
    if (inventoryCat !== "all" && item.category !== inventoryCat) return false;
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;
    return [item.title, item.brand, item.skuOrEnr, item.categoryLabel, item.shortSpecs]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <section
      aria-label="Marktplatz-Bestand verwalten"
      data-testid="admin-marketplace-manager"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden print:hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-4 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Package size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              Marktplatz-Bestand &amp; Fotos ({items.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fotos vom Gerät oder Typenschild direkt auf{" "}
              <a
                href="/marktplatz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>/marktplatz</span>
                <ExternalLink size={11} />
              </a>{" "}
              veröffentlichen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            data-testid="admin-add-marketplace-item-btn"
            className="col-span-2 sm:col-span-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-sky-500 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} />
            <span>Neuer Artikel + Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => void handleToggleHideSoldPublicly()}
            data-testid="admin-toggle-hide-sold-btn"
            className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
              mpSettings.hideSoldPublicly
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            }`}
          >
            {mpSettings.hideSoldPublicly ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>
              {mpSettings.hideSoldPublicly
                ? "Verkaufte versteckt"
                : "Verkaufte sichtbar"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetFiveDemos}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={13} />
            <span>5 Demos laden</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap"
          >
            {isExpanded ? "Einklappen" : "Anzeigen"}
          </button>
        </div>
      </div>

      {/* Quick Filter & Search inside Inventory */}
      {isExpanded && (
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
            <button
              type="button"
              onClick={() => setInventoryCat("all")}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                inventoryCat === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              Alle ({items.length})
            </button>
            {MARKETPLACE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setInventoryCat(cat.id)}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  inventoryCat === cat.id
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.target.value)}
            placeholder="Artikel, Marke oder E-Nr. suchen…"
            className="w-full sm:w-64 min-h-[44px] sm:min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </div>
      )}

      {/* Inventory Rows with Cover Photo Thumbnail */}
      {isExpanded && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredInventory.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Keine Marktplatz-Einträge für diesen Filter gefunden.
            </div>
          ) : (
            filteredInventory.map((item) => {
            const isAvailable =
              item.availability === "Sofort verfügbar in Osnabrück";
            const isReserved =
              item.availability === "Reserviert (Anfrage möglich)";
            const isSold =
              item.availability === "Verkauft (Abgeschlossen)";
            const gallery = resolveMarketplaceItemGallery(item);
            const cover = gallery[0];
            const uploadedCount = Array.isArray(item.photos) ? item.photos.length : 0;

            return (
              <div
                key={item.id}
                className={`px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                  isSold
                    ? "bg-slate-50/90 dark:bg-slate-950/60 opacity-90"
                    : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Cover Photo Thumbnail */}
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    title="Fotos bearbeiten oder hinzufügen"
                    className="relative h-14 w-18 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 cursor-pointer group"
                  >
                    <img
                      src={cover.src}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-slate-950/85 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                      {uploadedCount > 0 ? `${uploadedCount} Fotos` : "Standard"}
                    </span>
                  </button>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {item.brand}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {item.skuOrEnr}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {item.categoryLabel}
                      </span>
                      {isSold && (
                        <>
                          <span aria-hidden="true" className="text-slate-400">
                            ·
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            Verkauft
                            {item.linkedTicketId ? ` (Beleg ${item.linkedTicketId})` : ""}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.shortSpecs}
                    </p>
                  </div>
                </div>

                {/* 1-Click 3-State Availability + Sale Receipt & Edit Controls */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 shrink-0">
                  <div
                    role="group"
                    aria-label={`Status für ${item.title}`}
                    className="grid grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-1 gap-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void handleSetAvailability(item, "Sofort verfügbar in Osnabrück")
                      }
                      className={`inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                        isAvailable
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      <span>Verfügbar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleSetAvailability(item, "Reserviert (Anfrage möglich)")
                      }
                      className={`inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                        isReserved
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Clock size={12} />
                      <span>Reserviert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSoldQuickModal(item)}
                      data-testid={`mp-mark-sold-btn-${item.id}`}
                      className={`inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                        isSold
                          ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <ShoppingBag size={12} />
                      <span>Verkauft</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500 cursor-pointer whitespace-nowrap"
                    >
                      <Edit3 size={13} />
                      <span>Fotos &amp; Daten</span>
                    </button>

                  {confirmDeleteId === item.id ? (
                    <div className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-red-500/35 bg-red-500/10 px-2.5 py-1">
                      <span className="text-xs font-bold text-red-700 dark:text-red-300">
                        Löschen?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          void handleDeleteItem(item.id);
                        }}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white cursor-pointer"
                      >
                        Ja
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        Nein
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      title="Angebot löschen"
                      className="inline-flex min-h-[40px] sm:w-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:border-red-500 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span className="sm:hidden">Entfernen</span>
                    </button>
                  )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {/* Create / Edit Marketplace Offer Modal with Full Multi-Photo Studio */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Marktplatz-Angebot & Fotogalerie bearbeiten"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold truncate">
                  {form.id
                    ? "Angebot & Fotogalerie bearbeiten"
                    : "Neues Gerät oder Ersatzteil einstellen"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Fotos hochladen, Typenschild markieren &amp; Titelbild festlegen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Schließen"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveItem}
              className="flex flex-col flex-1 min-h-0 text-xs"
            >
              <div className="overflow-y-auto p-4 sm:p-5 space-y-5 flex-1">
              {/* ── QUICK-START PRESETS BAR ── */}
              {!form.id && (
                <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                    <Sparkles size={14} className="text-sky-600 dark:text-sky-400" />
                    <span>1-Klick Schnellvorlage für neuen Artikel:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKETPLACE_QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyQuickPreset(preset)}
                        className="min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 1. MULTI-PHOTO UPLOAD & GALLERY MANAGER ── */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ImageIcon size={15} className="text-sky-600 dark:text-sky-400" />
                      <span>Produktfotos &amp; Typenschild-Galerie</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Automatische WebP-Komprimierung · Bis zu {MAX_PHOTOS_PER_ITEM} Fotos pro Artikel ({form.photos.length}/{MAX_PHOTOS_PER_ITEM})
                    </p>
                  </div>

                  {/* Quick Upload & Mobile Camera Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={Boolean(uploadProgress) || form.photos.length >= MAX_PHOTOS_PER_ITEM}
                      data-testid="admin-select-photos-btn"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Upload size={13} />
                      <span>Fotos auswählen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={Boolean(uploadProgress) || form.photos.length >= MAX_PHOTOS_PER_ITEM}
                      data-testid="admin-camera-photo-btn"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-sky-500 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Camera size={13} className="text-sky-600 dark:text-sky-400" />
                      <span>Kamera öffnen</span>
                    </button>
                  </div>

                  {/* Hidden File & Camera Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        void handleFilesSelected(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        void handleFilesSelected(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Drag & Drop Target Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      void handleFilesSelected(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => {
                    if (!uploadProgress && form.photos.length < MAX_PHOTOS_PER_ITEM) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
                    isDraggingFiles
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-white/70 dark:bg-slate-900/60"
                  }`}
                >
                  {uploadProgress ? (
                    <div className="space-y-2 py-1">
                      <p className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                        {uploadProgress.statusText}
                      </p>
                      <div className="mx-auto h-2 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full bg-sky-600 transition-all duration-200"
                          style={{
                            width: `${Math.round(
                              (uploadProgress.current / uploadProgress.total) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">
                        Fotos hierher ziehen
                      </strong>{" "}
                      oder klicken, um mehrere Bilder (Front, Typenschild, Anschluss) hochzuladen
                    </p>
                  )}
                </div>

                {uploadError && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    {uploadError}
                  </p>
                )}

                {/* Uploaded Photos Gallery Grid (Cover + Reorder + Label Presets + Delete) */}
                {form.photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {form.photos.map((photo, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div
                          key={photo.id}
                          data-testid={`admin-uploaded-photo-${idx}`}
                          className={`rounded-xl border p-2.5 bg-white dark:bg-slate-900 space-y-2.5 ${
                            isPrimary
                              ? "border-sky-500 ring-1 ring-sky-500/40"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex gap-2.5">
                            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-700">
                              <img
                                src={photo.url}
                                alt={photo.label || `Foto ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute top-1 left-1 rounded bg-slate-950/85 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                              <div className="flex items-center justify-between gap-1">
                                {isPrimary ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-600 dark:text-sky-400">
                                    <Star size={12} className="fill-current" />
                                    <span>Titelbild</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryPhoto(idx)}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:border-sky-500 hover:text-sky-600 cursor-pointer"
                                  >
                                    <Star size={11} />
                                    <span>Als Titelbild</span>
                                  </button>
                                )}

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMovePhoto(idx, -1)}
                                    title="Nach vorne verschieben"
                                    aria-label="Nach vorne verschieben"
                                    className="flex min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-sky-500 cursor-pointer"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === form.photos.length - 1}
                                    onClick={() => handleMovePhoto(idx, 1)}
                                    title="Nach hinten verschieben"
                                    aria-label="Nach hinten verschieben"
                                    className="flex min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-sky-500 cursor-pointer"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeletePhoto(photo)}
                                    title="Foto entfernen"
                                    aria-label="Foto entfernen"
                                    className="flex min-h-[36px] min-w-[36px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-500 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={photo.label || ""}
                                onChange={(e) =>
                                  handleUpdatePhotoLabel(photo.id, e.target.value)
                                }
                                placeholder="Bildbeschriftung (z. B. Typenschild)"
                                className="w-full min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-base sm:text-[11px] font-semibold focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* 1-Click Label Presets */}
                          <div className="flex flex-wrap gap-1">
                            {PHOTO_LABEL_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  handleUpdatePhotoLabel(photo.id, preset)
                                }
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                                  photo.label === preset
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 2. PRODUCT DATA FIELDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as Exclude<
                        MarketplaceCategoryId,
                        "all"
                      >;
                      setForm((prev) => ({
                        ...prev,
                        category: nextCat,
                        conditionType:
                          nextCat === "spare_parts" ? "new_part" : "refurbished",
                      }));
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-semibold"
                  >
                    <option value="washing_drying">Waschmaschinen &amp; Trockner</option>
                    <option value="cooling">Kühl- &amp; Gefriergeräte</option>
                    <option value="dishwashers">Geschirrspüler</option>
                    <option value="ovens_stoves">Herde &amp; Backöfen</option>
                    <option value="spare_parts">Ersatzteile &amp; Zubehör</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Zustand
                  </label>
                  <select
                    value={form.conditionType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        conditionType: e.target.value as "refurbished" | "new_part",
                      }))
                    }
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-semibold"
                  >
                    <option value="refurbished">Geprüft &amp; Aufbereitet (Inkl. Garantie)</option>
                    <option value="new_part">Neu · Originalteil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Marke / Hersteller
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="z. B. Miele, Bosch, Siemens, Liebherr"
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    E-Nr. / PNC / Teilenummer
                  </label>
                  <input
                    type="text"
                    value={form.skuOrEnr}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, skuOrEnr: e.target.value }))
                    }
                    placeholder="z. B. E-Nr. WDB030WCS oder 00651956"
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Artikelbezeichnung (Titel)
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="z. B. Original BSH Heizpumpe 00651956 oder Miele W1 Waschmaschine"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kurz-Spezifikation (1 Zeile)
                </label>
                <input
                  type="text"
                  value={form.shortSpecs}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shortSpecs: e.target.value }))
                  }
                  placeholder="z. B. 8 kg Fassungsvermögen · 1400 U/min · Energieeffizienzklasse A"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-600 dark:text-slate-300">
                  3 Kernmerkmale auf der Karte
                </label>
                <input
                  type="text"
                  value={form.bullet1}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bullet1: e.target.value }))
                  }
                  placeholder="Merkmal 1"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                />
                <input
                  type="text"
                  value={form.bullet2}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bullet2: e.target.value }))
                  }
                  placeholder="Merkmal 2"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                />
                <input
                  type="text"
                  value={form.bullet3}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bullet3: e.target.value }))
                  }
                  placeholder="Merkmal 3"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck size={14} />
                  <span>Standard aktiv: „Preis auf Anfrage“ + Schriftliche Garantie</span>
                </span>
              </div>
              </div>

              <div className="shrink-0 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSaving || Boolean(uploadProgress)}
                  data-testid="admin-save-marketplace-item-btn"
                  className="min-h-[44px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 font-extrabold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isSaving ? "Speichert..." : "Im Marktplatz speichern"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sold + Optional Purchase/Warranty Receipt Modal */}
      {soldModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Artikel als verkauft markieren"
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold truncate">
                  Verkauf bestätigen
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {soldModal.item.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSoldModal(null)}
                aria-label="Schließen"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleConfirmSoldModal(e)}
              className="flex flex-col flex-1 min-h-0 text-xs"
            >
              <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
              <label className="flex items-start gap-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.07] p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soldModal.createTicket}
                  onChange={(e) =>
                    setSoldModal({
                      ...soldModal,
                      createTicket: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    Kauf- &amp; Garantiebeleg im Auftragsbuch anlegen
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Erstellt automatisch ein abgeschlossenes Verkaufs-Ticket inkl. Belegdruck.
                  </span>
                </div>
              </label>

              {soldModal.createTicket && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Käufername (optional)
                      </label>
                      <input
                        type="text"
                        value={soldModal.buyerName}
                        onChange={(e) =>
                          setSoldModal({ ...soldModal, buyerName: e.target.value })
                        }
                        placeholder="z. B. Frau Meyer (Barkauf)"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Telefon (optional)
                      </label>
                      <input
                        type="tel"
                        value={soldModal.buyerPhone}
                        onChange={(e) =>
                          setSoldModal({ ...soldModal, buyerPhone: e.target.value })
                        }
                        placeholder="z. B. 0170 ..."
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Verkaufspreis Brutto (€)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={soldModal.grossPriceInput}
                        onChange={(e) =>
                          setSoldModal({
                            ...soldModal,
                            grossPriceInput: e.target.value,
                          })
                        }
                        placeholder="z. B. 349"
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Schriftliche Garantie
                      </label>
                      <select
                        value={soldModal.warrantyMonths}
                        onChange={(e) =>
                          setSoldModal({
                            ...soldModal,
                            warrantyMonths: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs font-semibold"
                      >
                        <option value={12}>12 Monate Garantie</option>
                        <option value={24}>24 Monate Garantie</option>
                        <option value={6}>6 Monate Garantie</option>
                        <option value={0}>Ohne Zusatzgarantie</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              </div>

              <div className="shrink-0 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSoldModal(null)}
                  className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={savingSoldModal}
                  data-testid="confirm-marketplace-sold-submit-btn"
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-extrabold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {soldModal.createTicket ? <FileText size={14} /> : <Check size={14} />}
                  <span>
                    {savingSoldModal
                      ? "Wird gespeichert..."
                      : soldModal.createTicket
                      ? "Als verkauft markieren & Beleg öffnen"
                      : "Nur als verkauft markieren"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
