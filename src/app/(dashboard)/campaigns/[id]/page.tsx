"use client";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link as LinkIcon, Megaphone, X, Trash2, Check, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GachaRarity {
  id: string;
  name: string;
  probability: number;
  color: string;
}

import { LibrarySelectModal } from "@/components/features/campaigns/LibrarySelectModal";
import { AddRecipientModal } from "@/components/features/campaigns/AddRecipientModal";
import { useCampaignDetail } from "@/hooks/features/campaigns/useCampaignDetail";
import { useTranslation } from "@/lib/i18n";
import { useIsLgUp } from "@/hooks/useBreakpoint";
import { CampaignDetailMobileHeader } from "@/components/features/campaigns/detail/CampaignDetailMobileHeader";
import { CampaignSettingsSheet } from "@/components/features/campaigns/detail/CampaignSettingsSheet";
import { CampaignPublicLinkBanner } from "@/components/features/campaigns/detail/CampaignPublicLinkBanner";
import { CampaignDetailWorkArea } from "@/components/features/campaigns/detail/CampaignDetailWorkArea";
import { CampaignAssignWizard } from "@/components/features/campaigns/detail/CampaignAssignWizard";
import { CampaignDetailDesktopHeader } from "@/components/features/campaigns/detail/CampaignDetailDesktopHeader";
import { CampaignAssignFooter } from "@/components/features/campaigns/detail/CampaignAssignFooter";
import { CampaignAddRecipientFab } from "@/components/features/campaigns/detail/CampaignAddRecipientFab";
import { CampaignDangoToolBar } from "@/components/features/campaigns/detail/CampaignDangoToolBar";
import type { CampaignWorkTab } from "@/components/features/campaigns/detail/CampaignDetailWorkTabs";
import { escapeCsvField } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { hasGachaConfigHistory } from "@/lib/campaigns/external-link-mode";
import {
  buildDangoGachaDesignUrl,
  isDangoToolUrlSameOriginAsShareLink,
} from "@/lib/integrations/dango-tool-url";

export default function CampaignDetailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const focusExternalTx = searchParams.get("focus_external_tx");
  const {
    campaignId,
    campaign,
    workflowLoading,
    workflowError,
    files,
    recipients,
    activeDragFile,
    activeDragRecipient,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    assignFromLibrary,
    handleUnassignFromCampaign,
    handleRemoveFile,
    handleRemoveRecipient,
    handleMergeRecipients,
    toggleSelection,
    setSelectedFiles,
    toggleAllSelection,
    handleDragStart,
    handleDragEnd,
    assignFilesToRecipient,
    handleFilesDropped,
    deleteCampaign,
    handleUpdateGachaConfig,
    handleUpdateFileRarity,
    reloadWorkflow,
    liveViewers,
  } = useCampaignDetail();

  const [exportBusy, setExportBusy] = useState(false);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [addRecipientResetKey, setAddRecipientResetKey] = useState(0);
  const [statusBusy, setStatusBusy] = useState(false);
  const [isGachaConfigOpen, setIsGachaConfigOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "completed" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [securityConfirmOpen, setSecurityConfirmOpen] = useState(false);
  const [pendingSecurityLevel, setPendingSecurityLevel] = useState<"standard" | "high" | null>(null);
  const [integrationConfirmOpen, setIntegrationConfirmOpen] = useState(false);
  const [pendingIntegrationAction, setPendingIntegrationAction] = useState<
    "enable" | "pause" | null
  >(null);
  const [integrationBusy, setIntegrationBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [recipientsViewMode, setRecipientsViewMode] = useState<"grid" | "list">("grid");
  const isLgUp = useIsLgUp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initialTab = searchParams.get("tab");
  const [workTab, setWorkTab] = useState<CampaignWorkTab>(
    initialTab === "recipients" ? "recipients" : "files"
  );
  const [assignWizardOpen, setAssignWizardOpen] = useState(false);
  const [wizardInitialRecipientId, setWizardInitialRecipientId] = useState<string | null>(null);

  const openAssignWizard = useCallback(
    (opts?: { recipientId?: string }) => {
      setWizardInitialRecipientId(opts?.recipientId ?? null);
      setAssignWizardOpen(true);
    },
    []
  );

  const openAddRecipient = useCallback(() => {
    setAddRecipientResetKey((k) => k + 1);
    setAddRecipientOpen(true);
  }, []);

  const openDangoTool = useCallback(() => {
    if (!campaignId) return;
    const apiBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (apiBaseUrl && isDangoToolUrlSameOriginAsShareLink(apiBaseUrl)) {
      toast.error(
        "だんごツールの URL がこのアプリ（シェアリンク）を指しています。.env.local の NEXT_PUBLIC_DANGO_TOOL_URL を http://localhost:3001（だんごツール側）に設定してください。"
      );
      return;
    }
    window.open(buildDangoGachaDesignUrl(campaignId, apiBaseUrl), "_blank", "noopener,noreferrer");
  }, [campaignId]);

  const recipientsViewModeEffective = isLgUp ? recipientsViewMode : "list";

  const handleUpdateStatus = useCallback(
    async (newStatus: "active" | "completed") => {
      if (!campaignId) return;
      setStatusBusy(true);
      setBanner(null);
      try {
        const r = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!r.ok) throw new Error();
        await reloadWorkflow();
        toast.success(newStatus === "active" ? "キャンペーンを公開しました" : "キャンペーンを終了しました");
      } catch {
        toast.error("ステータスの更新に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setStatusBusy(false);
      }
    },
    [campaignId, reloadWorkflow]
  );

  const handleUpdateSecurity = useCallback(
    async (newLevel: "standard" | "high") => {
      if (!campaignId) return;
      setStatusBusy(true);
      try {
        const body: { securityLevel: "standard" | "high"; distributionMode?: string } = { securityLevel: newLevel };
        if (newLevel === "standard") {
          body.distributionMode = "reception";
        }
        const r = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error();
        await reloadWorkflow();
        toast.success(newLevel === "standard" ? "公開配布に切り替えました" : "限定配布に切り替えました");
      } catch {
        toast.error("設定の更新に失敗しました");
      } finally {
        setStatusBusy(false);
      }
    },
    [campaignId, reloadWorkflow]
  );

  const handleExportCsv = useCallback(async () => {
    if (!campaignId) return;
    setExportBusy(true);
    setBanner(null);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/claim-export`);
      if (!r.ok) throw new Error();
      const data = (await r.json()) as {
        rows: Array<{
          recipientDisplayName: string;
          assetLabel: string;
          status: string;
          externalTransactionId: string;
          claimUrl: string;
        }>;
        campaignName: string;
      };

      if (data.rows.length === 0) {
        toast.error(t.campaigns.exportNoClaims);
        return;
      }

      const header = [
        t.campaigns.csvRecipient,
        t.campaigns.csvAsset,
        t.campaigns.csvStatus,
        t.campaigns.csvExternalId,
        t.campaigns.csvLink,
      ];
      const lines = [
        header.map(escapeCsvField).join(","),
        ...data.rows.map((row) =>
          [
            row.recipientDisplayName,
            row.assetLabel,
            row.status,
            row.externalTransactionId,
            row.claimUrl,
          ]
            .map(escapeCsvField)
            .join(",")
        ),
      ];
      const csv = `\uFEFF${lines.join("\r\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = data.campaignName.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 80);
      a.download = `${safeName || "campaign"}-claims.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setBanner({ tone: "ok", text: t.campaigns.exportDone });
    } catch {
      toast.error(t.campaigns.exportFailed);
    } finally {
      setExportBusy(false);
    }
  }, [campaignId, t]);

  const isPublic = campaign?.securityLevel === "standard";
  const gachaWasConfigured = hasGachaConfigHistory(campaign?.gachaConfig ?? null);

  const runIntegrationToggle = useCallback(
    async (action: "enable" | "pause") => {
      if (!campaignId) return;
      setIntegrationBusy(true);
      try {
        if (action === "pause") {
          const r = await fetch(`/api/campaigns/${campaignId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isExternalLinked: false }),
          });
          if (!r.ok) throw new Error();
          await reloadWorkflow();
          toast.success(t.campaigns.gacha.modePaused);
          return;
        }

        if (!gachaWasConfigured) {
          const defaultConfig = {
            rarities: [
              { id: "rarity-1", name: "SSR", probability: 5, color: "#FFD700" },
              { id: "rarity-2", name: "SR", probability: 15, color: "#C0C0C0" },
              { id: "rarity-3", name: "R", probability: 30, color: "#CD7F32" },
              { id: "rarity-4", name: "N", probability: 50, color: "#94a3b8" },
            ],
          };
          await handleUpdateGachaConfig(defaultConfig);
        }

        const r = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isExternalLinked: true }),
        });
        if (!r.ok) {
          const err = (await r.json().catch(() => ({}))) as { message?: string };
          throw new Error(err.message || "update failed");
        }
        await reloadWorkflow();
        toast.success(t.campaigns.gacha.modeEnabled);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "連携設定の更新に失敗しました"
        );
      } finally {
        setIntegrationBusy(false);
      }
    },
    [
      campaignId,
      gachaWasConfigured,
      handleUpdateGachaConfig,
      reloadWorkflow,
      t.campaigns.gacha.modeEnabled,
      t.campaigns.gacha.modePaused,
    ]
  );


  const copyReceptionUrl = useCallback(() => {
    if (!campaign?.publicReceptionToken) return;
    const u = `${window.location.origin}/receive/${campaign.publicReceptionToken}`;
    void navigator.clipboard.writeText(u);
    toast.success("受付URLをコピーしました");
  }, [campaign]);

  const showRecipientFab =
    !isLgUp &&
    workTab === "recipients" &&
    !isPublic &&
    campaign?.status !== "completed";

  const needsMobileBottomPad = selectedFileIds.size > 0 || showRecipientFab;

  const openPublishFlow = useCallback(() => {
    if (campaign?.status === "draft") {
      setPendingStatus("active");
      setConfirmOpen(true);
    } else if (campaign?.status === "active") {
      setPendingStatus("completed");
      setConfirmOpen(true);
    } else if (campaign?.status === "completed") {
      setPendingStatus("active");
      setConfirmOpen(true);
    }
  }, [campaign?.status]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isLgUp && "h-[calc(100vh-8rem)] min-h-0 gap-6",
        needsMobileBottomPad && "pb-24 lg:pb-0"
      )}
    >
      <CampaignDetailMobileHeader
        campaign={campaign ?? null}
        workflowLoading={workflowLoading}
        liveViewers={liveViewers}
        statusBusy={statusBusy}
        selectedFileCount={selectedFileIds.size}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAssignWizard={() => openAssignWizard()}
        onPublishAction={openPublishFlow}
        onCopyReceptionUrl={
          campaign?.distributionMode === "reception" && campaign.publicReceptionToken
            ? copyReceptionUrl
            : undefined
        }
      />

      {!isLgUp && !isPublic ? (
        <CampaignDangoToolBar
          className="lg:hidden"
          isExternalLinked={!!campaign?.isExternalLinked}
          onOpenDangoTool={openDangoTool}
          onOpenGachaConfig={() => setIsGachaConfigOpen(true)}
          onStartIntegration={() => setSettingsOpen(true)}
        />
      ) : null}

      <CampaignDetailDesktopHeader
        campaign={campaign ?? null}
        campaignId={campaignId ?? null}
        workflowLoading={workflowLoading}
        liveViewers={liveViewers}
        statusBusy={statusBusy}
        exportBusy={exportBusy}
        isDeleting={isDeleting}
        onOpenSettings={() => setSettingsOpen(true)}
        onPublishAction={openPublishFlow}
        onExportCsv={() => void handleExportCsv()}
        onDelete={() => setDeleteConfirmOpen(true)}
        onCopyReceptionUrl={copyReceptionUrl}
        showReceptionCopy={
          !!(isPublic && campaign?.distributionMode === "reception" && campaign.publicReceptionToken)
        }
        isExternalLinked={!!campaign?.isExternalLinked}
        onOpenDangoTool={campaign?.isExternalLinked ? openDangoTool : undefined}
        onOpenGachaConfig={
          campaign?.isExternalLinked ? () => setIsGachaConfigOpen(true) : undefined
        }
      />

      {workflowError && (
        <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2 bg-destructive/5">
          {workflowError}
        </p>
      )}

      {banner && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
            banner.tone === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {banner.tone === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <p className="text-sm font-medium">{banner.text}</p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isPublic && campaign?.status === "active" && campaign.publicReceptionToken && (
        <>
          <div className="hidden lg:block">
            <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 shadow-sm">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    <LinkIcon className="h-5 w-5 text-emerald-500" />
                    パブリック共有リンク
                  </h3>
                  <p className="text-sm font-medium text-emerald-700/70 dark:text-emerald-400/70">
                    このリンクをSNSや概要欄に貼るだけで、誰でもファイルを受け取れます。
                  </p>
                </div>
                <div className="flex w-full items-center gap-3 md:w-auto">
                  <div className="flex-1 truncate rounded-2xl border border-emerald-500/20 bg-white/50 px-4 py-3 font-mono text-xs text-muted-foreground shadow-inner dark:bg-black/20 md:w-80">
                    {`${typeof window !== "undefined" ? window.location.origin : ""}/receive/${campaign.publicReceptionToken}`}
                  </div>
                  <Button
                    onClick={copyReceptionUrl}
                    className="h-12 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                  >
                    コピー
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:hidden">
            <CampaignPublicLinkBanner publicToken={campaign.publicReceptionToken} />
          </div>
        </>
      )}

      <div className={cn("min-h-0", isLgUp && "flex flex-1 flex-col")}>
        <CampaignDetailWorkArea
          isLgUp={isLgUp}
          workTab={workTab}
          onWorkTabChange={setWorkTab}
          workflowLoading={workflowLoading}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          files={files}
          recipients={recipients}
          selectedFileIds={selectedFileIds}
          toggleSelection={toggleSelection}
          toggleAllSelection={toggleAllSelection}
          setSelectedFiles={setSelectedFiles}
          handleFilesDropped={handleFilesDropped}
          onOpenLibrary={() => {
            setShowLibraryModal(true);
            fetchLibraryFiles();
          }}
          handleUnassignFromCampaign={handleUnassignFromCampaign}
          rarities={campaign?.gachaConfig?.rarities}
          onUpdateFileRarity={handleUpdateFileRarity}
          pulsedRecipientId={pulsedRecipientId}
          onRemoveFile={handleRemoveFile}
          onRemoveRecipient={handleRemoveRecipient}
          onMergeRecipients={handleMergeRecipients}
          onAddRecipients={() => {
            setAddRecipientResetKey((k) => k + 1);
            setAddRecipientOpen(true);
          }}
          addRecipientsDisabled={workflowLoading || campaign?.status !== "active"}
          showPoolEmptyHint={!workflowLoading && files.length === 0}
          isDraft={campaign?.status === "draft"}
          isPublic={isPublic}
          recipientsViewMode={recipientsViewModeEffective}
          onRecipientsViewModeChange={setRecipientsViewMode}
          focusExternalTx={focusExternalTx}
          activeDragFile={activeDragFile}
          activeDragRecipient={activeDragRecipient}
          draggedFileIds={draggedFileIds}
          onRequestAssignWizard={(recipientId) => openAssignWizard({ recipientId })}
        />
      </div>

      <CampaignAssignFooter
        selectedCount={selectedFileIds.size}
        onAssign={() => openAssignWizard()}
      />

      <CampaignAddRecipientFab
        visible={showRecipientFab}
        disabled={workflowLoading || campaign?.status !== "active"}
        isDraft={campaign?.status === "draft"}
        onAdd={openAddRecipient}
        onPublish={openPublishFlow}
      />

      <CampaignSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        campaign={campaign ?? null}
        campaignId={campaignId ?? null}
        workflowLoading={workflowLoading}
        statusBusy={statusBusy}
        exportBusy={exportBusy}
        isDeleting={isDeleting}
        integrationBusy={integrationBusy}
        isPublic={isPublic}
        gachaWasConfigured={gachaWasConfigured}
        onPublishAction={openPublishFlow}
        onExportCsv={() => void handleExportCsv()}
        onDelete={() => setDeleteConfirmOpen(true)}
        onSecurityChange={(level) => {
          setPendingSecurityLevel(level);
          setSecurityConfirmOpen(true);
        }}
        onIntegrationToggle={(action) => {
          setPendingIntegrationAction(action);
          setIntegrationConfirmOpen(true);
        }}
        onOpenGachaConfig={() => {
          setSettingsOpen(false);
          setIsGachaConfigOpen(true);
        }}
        onOpenDangoTool={openDangoTool}
        onDistributionModeChange={(mode) => {
          if (!campaignId) return;
          void (async () => {
            const r = await fetch(`/api/campaigns/${campaignId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ distributionMode: mode }),
            });
            if (r.ok) await reloadWorkflow();
          })();
        }}
        onExpiresAtChange={(iso) => {
          if (!campaignId) return;
          void (async () => {
            const r = await fetch(`/api/campaigns/${campaignId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expiresAt: iso }),
            });
            if (r.ok) await reloadWorkflow();
          })();
        }}
        onClearExpiresAt={() => {
          if (!campaignId) return;
          void (async () => {
            const r = await fetch(`/api/campaigns/${campaignId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expiresAt: null }),
            });
            if (r.ok) await reloadWorkflow();
          })();
        }}
        onCopyReceptionUrl={copyReceptionUrl}
      />

      <CampaignAssignWizard
        open={assignWizardOpen}
        onClose={() => {
          setAssignWizardOpen(false);
          setWizardInitialRecipientId(null);
        }}
        files={files}
        recipients={recipients}
        initialFileIds={selectedFileIds}
        initialRecipientId={wizardInitialRecipientId}
        onAssign={assignFilesToRecipient}
        onSuccess={() => {
          setWorkTab("recipients");
          toast.success("ファイルを割り当てました");
        }}
      />

      <LibrarySelectModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        libraryFiles={libraryFiles}
        assignedAssetIds={files.map((f) => f.libraryAssetId).filter(Boolean) as string[]}
        onAssignSelected={assignFromLibrary}
      />

      {campaignId ? (
        <AddRecipientModal
          key={addRecipientResetKey}
          isOpen={addRecipientOpen}
          onClose={() => setAddRecipientOpen(false)}
          campaignId={campaignId}
          poolFiles={files}
          existingRecipients={recipients}
          onIssued={async () => {
            await reloadWorkflow();
            toast.success(t.campaigns.addRecipientSuccess);
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (pendingStatus) void handleUpdateStatus(pendingStatus);
        }}
        title={
          pendingStatus === "active" 
            ? (campaign?.status === "completed" ? "キャンペーンを再開" : "キャンペーンを公開")
            : "キャンペーンを終了"
        }
        description={
          pendingStatus === "active"
            ? (campaign?.status === "completed" 
                ? "キャンペーンを再開しますか？リスナーが再びアクセスできるようになります。" 
                : "キャンペーンを公開しますか？これ以降、リスナーがファイルを受け取れるようになります。")
            : "キャンペーンを終了しますか？終了すると、リスナーはファイルの受け取りができなくなります。"
        }
        confirmText={
          pendingStatus === "active" 
            ? (campaign?.status === "completed" ? "再開する" : "公開する")
            : "終了する"
        }
        variant={pendingStatus === "active" ? "emerald" : "destructive"}
        isLoading={statusBusy}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          await deleteCampaign();
          setIsDeleting(false);
        }}
        title={t.campaigns.deleteConfirmTitle}
        description={t.campaigns.deleteConfirmDescription}
        confirmText={t.common.delete}
        variant="destructive"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={integrationConfirmOpen}
        onClose={() => {
          setIntegrationConfirmOpen(false);
          setPendingIntegrationAction(null);
        }}
        onConfirm={async () => {
          if (!pendingIntegrationAction) return;
          await runIntegrationToggle(pendingIntegrationAction);
          setIntegrationConfirmOpen(false);
          setPendingIntegrationAction(null);
        }}
        title={
          pendingIntegrationAction === "pause"
            ? t.campaigns.gacha.pauseConfirmTitle
            : gachaWasConfigured
              ? t.campaigns.gacha.enableTitleResume
              : t.campaigns.gacha.enableConfirmTitle
        }
        description={
          pendingIntegrationAction === "pause"
            ? t.campaigns.gacha.pauseConfirmDescription
            : gachaWasConfigured
              ? t.campaigns.gacha.enableConfirmResumeDescription
              : t.campaigns.gacha.enableConfirmDescription
        }
        confirmText={
          pendingIntegrationAction === "pause"
            ? t.campaigns.gacha.pauseConfirmAction
            : gachaWasConfigured
              ? t.campaigns.gacha.resumeConfirmAction
              : t.campaigns.gacha.enableConfirmAction
        }
        variant={pendingIntegrationAction === "pause" ? "destructive" : "emerald"}
        isLoading={integrationBusy}
      />

      <ConfirmModal
        isOpen={securityConfirmOpen}
        onClose={() => setSecurityConfirmOpen(false)}
        onConfirm={() => {
          if (pendingSecurityLevel) {
            void handleUpdateSecurity(pendingSecurityLevel);
            setSecurityConfirmOpen(false);
          }
        }}
        title={pendingSecurityLevel === "standard" ? "公開配布に切り替え" : "限定配布に切り替え"}
        description={
          pendingSecurityLevel === "standard"
            ? "公開配布に切り替えますか？これ以降、リンクを知っている人なら誰でも（パスキーなしで）ファイルを閲覧・ダウンロードできるようになります。"
            : "限定配布に切り替えますか？これ以降、閲覧にはパスキーによる本人確認が必須となります。すでにリンクを持っている人も、再度パスキーの登録や認証が必要になります。"
        }
        confirmText="切り替える"
        variant={pendingSecurityLevel === "standard" ? "emerald" : "default"}
        isLoading={statusBusy}
      />

      <Dialog isOpen={isGachaConfigOpen} onClose={() => setIsGachaConfigOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Megaphone className="w-6 h-6" />
            </div>
            {t.campaigns.gacha.configTitle}
          </DialogTitle>
          <DialogDescription>
            {t.campaigns.gacha.configDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto scrollbar-none px-1">
          <div className="flex items-center justify-between bg-purple-500/5 rounded-2xl px-6 py-4 border border-purple-500/10 sticky top-0 z-10 backdrop-blur-md">
            <span className="text-sm font-bold text-purple-900/60 dark:text-purple-100/60 uppercase tracking-wider">
              {t.campaigns.gacha.totalProbability}
            </span>
            <div className={cn(
              "px-4 py-1.5 rounded-xl font-mono text-lg font-black transition-all",
              Math.abs((campaign?.gachaConfig?.rarities?.reduce((acc: number, r: GachaRarity) => acc + r.probability, 0) || 0) - 100) < 0.01
                ? "bg-emerald-500/20 text-emerald-600"
                : "bg-amber-500/20 text-amber-600"
            )}>
              {Math.round((campaign?.gachaConfig?.rarities?.reduce((acc: number, r: GachaRarity) => acc + r.probability, 0) || 0) * 10) / 10}%
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {campaign?.gachaConfig?.rarities.map((rarity: GachaRarity) => (
              <div
                key={rarity.id}
                className="group relative p-5 rounded-[2rem] bg-white dark:bg-white/5 border border-border/50 hover:border-purple-500/30 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="relative group/color">
                      <div className="w-8 h-8 rounded-xl shadow-sm cursor-pointer border-2 border-white dark:border-black" style={{ backgroundColor: rarity.color }} />
                      <div className="absolute top-full left-0 mt-2 p-2 bg-background border border-border rounded-xl shadow-2xl z-50 opacity-0 group-hover/color:opacity-100 pointer-events-none group-hover/color:pointer-events-auto transition-all flex gap-1 flex-wrap w-32">
                        {["#FFD700", "#C0C0C0", "#CD7F32", "#94a3b8", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"].map(c => (
                          <div 
                            key={c} 
                            className="w-6 h-6 rounded-md cursor-pointer hover:scale-110 transition-transform" 
                            style={{ backgroundColor: c }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = campaign.gachaConfig!.rarities.map((r: GachaRarity) => r.id === rarity.id ? { ...r, color: c } : r);
                              handleUpdateGachaConfig({ rarities: next });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={rarity.name}
                      onChange={(e) => {
                        const next = campaign.gachaConfig!.rarities.map((r: GachaRarity) => r.id === rarity.id ? { ...r, name: e.target.value } : r);
                        handleUpdateGachaConfig({ rarities: next });
                      }}
                      className="bg-transparent border-none outline-none text-base font-black tracking-tight flex-1"
                      placeholder="レア度名"
                    />
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex items-center flex-1 sm:w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={rarity.probability}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = campaign.gachaConfig!.rarities.map((r: GachaRarity) => r.id === rarity.id ? { ...r, probability: val } : r);
                          handleUpdateGachaConfig({ rarities: next });
                        }}
                        className="w-full bg-transparent border-b-2 border-border focus:border-purple-500 outline-none text-xl font-black tabular-nums transition-colors pr-6 text-right"
                      />
                      <span className="absolute right-0 text-sm font-bold text-muted-foreground">%</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        const next = campaign.gachaConfig!.rarities.filter((r: GachaRarity) => r.id !== rarity.id);
                        handleUpdateGachaConfig({ rarities: next });
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const id = `rarity-${Date.now()}`;
              const next = [...(campaign?.gachaConfig?.rarities || []), { id, name: "NEW", probability: 0, color: "#94a3b8" }];
              handleUpdateGachaConfig({ rarities: next });
            }}
            className="w-full py-4 rounded-[2rem] border-2 border-dashed border-purple-500/20 text-purple-600 font-bold hover:bg-purple-500/5 hover:border-purple-500/40 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            レア度を追加
          </button>

          <div className="pt-4 flex justify-end sticky bottom-0 bg-background/50 backdrop-blur-sm py-4">
            <Button 
              onClick={() => setIsGachaConfigOpen(false)}
              className="rounded-2xl px-12 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xl shadow-purple-500/20"
            >
              完了
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
