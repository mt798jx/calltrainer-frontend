"use client";

import EyeIcon from "@rsuite/icons/Detail";
import PlusIcon from "@rsuite/icons/Plus";
import SearchIcon from "@rsuite/icons/Search";
import TrashIcon from "@rsuite/icons/Trash";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Input,
  InputGroup,
  InputNumber,
  Loader,
  Message,
  Modal,
  SelectPicker,
  TagPicker,
  useToaster,
} from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useScenarios } from "@/hooks/useScenarios";
import { useUsers } from "@/hooks/useUsers";
import { tasksApi } from "@/lib/api";
import type {
  CreateTaskData,
  ScenarioResponse,
  TaskResponse,
  UserResponse,
} from "@/types/api";
import Footer from "../../components/Footer";

interface Task {
  id: string;
  title: string;
  description: string;
  scenario: {
    id: string;
    title: string;
  };
  deadline: string;
  assignedOperators: {
    id: number;
    name: string;
    email: string;
  }[];
  minScore: number;
  maxAttempts: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  progress: {
    completed: number;
    total: number;
  };
}

export default function TasksManagementPage() {
  const toaster = useToaster();
  const queryClient = useQueryClient();

  // Tasks from backend API (no separate hook file)
  const { data: tasks = [], isLoading } = useQuery<TaskResponse[]>({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskData> }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "COMPLETED" | "OVERDUE"
  >("ALL");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedKos, setSelectedKos] = useState<string[]>([]);

  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    scenarioId: "",
    deadline: null as Date | null,
    operatorIds: [] as number[],
    minScore: 75,
    maxAttempts: 3,
  });

  // Scenáre z API
  const { data: scenariosData } = useScenarios();
  const scenarioOptions = (scenariosData || []).map((s: ScenarioResponse) => ({
    label: s.title,
    value: s.id,
    severity: s.severity,
    status: s.status,
  }));

  // Load real users for assignment
  const { data: users } = useUsers();

  const operatorOptions = (users || [])
    .filter((u: UserResponse) => u.role === "OPERATOR")
    .map((u: UserResponse) => ({
      label: `${u.first_name} ${u.last_name} (${u.email})`,
      value: u.id,
    }));

  // Enrich local tasks with scenario and operator information for display
  const enrichedTasks: Task[] = useMemo(() => {
    const sc = scenariosData || [];
    const us = users || [];
    return (tasks || []).map((t: TaskResponse) => {
      const scenario = sc.find(
        (s: ScenarioResponse) => s.id === t.scenarioId,
      ) || {
        id: t.scenarioId || "",
        title: "-",
      };
      const assignedOperators = (t.operatorIds || []).map((opId: number) => {
        const u = us.find((x: UserResponse) => x.id === opId);
        return {
          id: opId,
          name: u ? `${u.first_name} ${u.last_name}` : `#${opId}`,
          email: u ? u.email : "",
        };
      });

      return {
        id: t.id,
        title: t.title,
        description: t.description || "",
        scenario: { id: scenario.id, title: scenario.title },
        deadline: t.deadline || "",
        assignedOperators,
        minScore: t.minScore,
        maxAttempts: t.maxAttempts,
        status: t.status,
        progress: t.progress || { completed: 0, total: 0 },
      } as Task;
    });
  }, [tasks, users, scenariosData]);

  const filteredTasks = useMemo(() => {
    if (!enrichedTasks) return [];

    return enrichedTasks.filter((task) => {
      const query = searchValue.toLowerCase();
      const matchesText =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.scenario.title.toLowerCase().includes(query) ||
        task.assignedOperators.some(
          (op) =>
            op.name.toLowerCase().includes(query) ||
            op.email.toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [enrichedTasks, searchValue, statusFilter]);

  const stats = useMemo(() => {
    if (!enrichedTasks)
      return { total: 0, active: 0, completed: 0, overdue: 0 };

    return {
      total: enrichedTasks.length,
      active: enrichedTasks.filter((t) => t.status === "ACTIVE").length,
      completed: enrichedTasks.filter((t) => t.status === "COMPLETED").length,
      overdue: enrichedTasks.filter((t) => t.status === "OVERDUE").length,
    };
  }, [enrichedTasks]);

  const handleOpenCreate = () => {
    setCreateFormData({
      title: "",
      description: "",
      scenarioId: "",
      deadline: null,
      operatorIds: [],
      minScore: 75,
      maxAttempts: 3,
    });
    setSelectedKos([]);
    setEditingTaskId(null);
    setCreateModal(true);
  };

  const handleOpenDelete = (task: Task) => {
    setSelectedTask(task);
    setDeleteModal(true);
  };

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    // Prefill create form for editing
    setCreateFormData({
      title: task.title,
      description: task.description,
      scenarioId: task.scenario.id,
      deadline: task.deadline ? new Date(task.deadline) : null,
      operatorIds: task.assignedOperators.map((o) => o.id),
      minScore: task.minScore,
      maxAttempts: task.maxAttempts,
    });
    setSelectedKos([]);
    setEditingTaskId(task.id);
    setDetailModal(false);
    setCreateModal(true);
  };

  const handleCreate = async () => {
    // If editingTaskId is set, update; otherwise create new
    if (editingTaskId) {
      await updateMutation.mutateAsync({
        id: editingTaskId,
        data: {
          title: createFormData.title,
          description: createFormData.description,
          scenarioId: createFormData.scenarioId,
          deadline: createFormData.deadline
            ? createFormData.deadline.toISOString()
            : undefined,
          operatorIds: createFormData.operatorIds,
          minScore: createFormData.minScore,
          maxAttempts: createFormData.maxAttempts,
        },
      });
      toaster.push(
        <Message showIcon type="success">
          Úloha bola upravená
        </Message>,
        { placement: "topEnd" },
      );
      setEditingTaskId(null);
    } else {
      // create via backend API
      await createMutation.mutateAsync({
        title: createFormData.title,
        description: createFormData.description,
        scenarioId: createFormData.scenarioId,
        deadline: createFormData.deadline
          ? createFormData.deadline.toISOString()
          : undefined,
        operatorIds: createFormData.operatorIds,
        minScore: createFormData.minScore,
        maxAttempts: createFormData.maxAttempts,
      });

      toaster.push(
        <Message showIcon type="success">
          Úloha bola úspešne vytvorená
        </Message>,
        { placement: "topEnd" },
      );
    }

    setCreateModal(false);
  };

  const handleDelete = async () => {
    if (selectedTask) {
      await deleteMutation.mutateAsync(selectedTask.id);
    }
    toaster.push(
      <Message showIcon type="success">
        Úloha bola odstránená
      </Message>,
      { placement: "topEnd" },
    );
    setDeleteModal(false);
    setSelectedTask(null);
  };

  const min3 = (v?: string) => typeof v === "string" && v.trim().length >= 3;

  const statusFilterOptions = [
    { label: "Všetky statusy", value: "ALL" },
    { label: "Aktívne", value: "ACTIVE" },
    { label: "Dokončené", value: "COMPLETED" },
    { label: "Po termíne", value: "OVERDUE" },
  ];

  const kosOptions = [
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO BRATISLAVA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO BRATISLAVA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO TRNAVA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO TRNAVA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO NITRA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO NITRA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO TRENČÍN",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO TRENČÍN",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO BANSKÁ BYSTRICA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO BANSKÁ BYSTRICA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO ŽILINA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO ŽILINA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO PREŠOV",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO PREŠOV",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO KOŠICE",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO KOŠICE",
    },
  ];

  if (isLoading) {
    return (
      <div className="users-loader-container">
        <Loader size="lg" content="Načítavam úlohy..." />
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Aktívne";
      case "INACTIVE":
        return "Neaktívny";
      case "COMPLETED":
        return "Dokončené";
      case "OVERDUE":
        return "Po termíne";
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "task-status-active";
      case "COMPLETED":
        return "task-status-completed";
      case "OVERDUE":
        return "task-status-overdue";
      default:
        return "";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "Kritický";
      case "HIGH":
        return "Vysoký";
      case "MEDIUM":
        return "Stredný";
      default:
        return severity;
    }
  };

  const pillStyle = (bg: string, color = "#111827") => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 9999,
    fontSize: 12,
    lineHeight: "16px",
    backgroundColor: bg,
    color,
    fontWeight: 500 as const,
  });

  const statusPillStyle = (status: string) =>
    status === "ACTIVE"
      ? pillStyle("#dcfce7", "#166534")
      : pillStyle("#f3f4f6", "#374151");

  const severityPillStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return pillStyle("#fee2e2", "#991b1b");
      case "HIGH":
        return pillStyle("#ffedd5", "#9a3412");
      case "MEDIUM":
        return pillStyle("#dbeafe", "#1e40af");
      default:
        return pillStyle("#e5e7eb");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("sk-SK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="pageBackground">
      {/* Header */}
      <DashboardHeader userName="Admin" userRole="Admin" />

      {/* Content */}
      <div className="scenarios-content">
        <div className="scenarios-title-bar">
          <h2 className="scenarios-page-title">Priradené úlohy</h2>
          <Button
            appearance="primary"
            color="red"
            startIcon={<PlusIcon />}
            onClick={handleOpenCreate}
          >
            Vytvoriť úlohu
          </Button>
        </div>

        {/* Stats */}
        <div className="scenarios-stats-grid">
          <button
            type="button"
            className="scenarios-stat-card is-total"
            onClick={() => setStatusFilter("ALL")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Celkovo úloh</h3>
            <p className="scenarios-stat-value">{stats.total}</p>
          </button>

          <button
            type="button"
            className="scenarios-stat-card is-status"
            onClick={() => {
              if (statusFilter === "ALL") {
                setStatusFilter("ACTIVE");
              } else if (statusFilter === "ACTIVE") {
                setStatusFilter("OVERDUE");
              } else {
                setStatusFilter("ALL");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (statusFilter === "ALL") {
                  setStatusFilter("ACTIVE");
                } else if (statusFilter === "ACTIVE") {
                  setStatusFilter("OVERDUE");
                } else {
                  setStatusFilter("ALL");
                }
              }
            }}
          >
            <h3 className="scenarios-stat-label">Aktívne / Po termíne</h3>
            <div className="scenarios-stat-dual">
              <p className="scenarios-stat-value scenarios-stat-value-active">
                {stats.active}
              </p>
              <span className="scenarios-stat-divider">/</span>
              <p
                className="scenarios-stat-subvalue"
                style={{ color: "#ef4444" }}
              >
                {stats.overdue}
              </p>
            </div>
          </button>

          <button
            type="button"
            className="scenarios-stat-card is-completed"
            onClick={() =>
              setStatusFilter(
                statusFilter === "COMPLETED" ? "ALL" : "COMPLETED",
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setStatusFilter(
                  statusFilter === "COMPLETED" ? "ALL" : "COMPLETED",
                );
              }
            }}
          >
            <h3 className="scenarios-stat-label">Dokončených</h3>
            <p className="scenarios-stat-value" style={{ color: "#22c55e" }}>
              {stats.completed}
            </p>
          </button>
        </div>

        {/* Search */}
        <div
          className="scenarios-search-container"
          style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
        >
          <div style={{ flex: "1 1 260px" }}>
            <InputGroup inside style={{ width: "100%" }}>
              <Input
                placeholder="Hľadať úlohu..."
                value={searchValue}
                onChange={setSearchValue}
                style={{ fontSize: "14px" }}
              />
              <InputGroup.Addon>
                <SearchIcon />
              </InputGroup.Addon>
            </InputGroup>
          </div>
          <SelectPicker
            data={statusFilterOptions}
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(
                value as "ALL" | "ACTIVE" | "COMPLETED" | "OVERDUE",
              )
            }
            searchable={false}
            cleanable={false}
            style={{ minWidth: 180 }}
            placeholder="Filtrovať status"
          />
        </div>

        {/* Tasks Cards */}
        <div className="scenarios-cards-grid">
          {filteredTasks.length === 0 ? (
            <div className="scenarios-empty">
              <p>Žiadne úlohy</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="scenario-card">
                <div className="scenario-card-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <h3 className="scenario-card-title" style={{ margin: 0 }}>
                      {task.title}
                    </h3>
                    <span
                      className={`scenario-status-badge ${getStatusBadgeClass(task.status)}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  {task.description && (
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#6b7280",
                        lineHeight: "1.5",
                      }}
                    >
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="scenario-card-body">
                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Scenár:</p>
                    <p className="scenario-card-value">{task.scenario.title}</p>
                  </div>

                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Termín:</p>
                    <p className="scenario-card-value">
                      {formatDate(task.deadline)}
                    </p>
                  </div>

                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Priradené:</p>
                    <p className="scenario-card-value">
                      {task.assignedOperators.length} operátorov
                    </p>
                  </div>

                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Minimálne skóre:</p>
                    <p className="scenario-card-value">{task.minScore}%</p>
                  </div>

                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Max. pokusy:</p>
                    <p className="scenario-card-value">{task.maxAttempts}</p>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span className="scenario-card-label">Dokončenie</span>
                      <span className="scenario-card-value">
                        {task.progress.completed} / {task.progress.total}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(task.progress.completed / task.progress.total) * 100}%`,
                          height: "100%",
                          backgroundColor:
                            task.status === "COMPLETED" ? "#22c55e" : "#3b82f6",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="scenario-card-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(task)}
                    className="scenario-action-btn scenario-action-detail"
                  >
                    <EyeIcon style={{ fontSize: "16px" }} />
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    className="scenario-action-btn scenario-action-edit"
                    style={{ marginLeft: 8 }}
                  >
                    Upraviť
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(task)}
                    className="scenario-action-btn scenario-action-delete"
                  >
                    <TrashIcon style={{ fontSize: "16px" }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        size="sm"
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>Vytvoriť novú úlohu</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Priraďte tréningový scenár operátorom
          </p>
          <div className="scenario-modal-form">
            <div className="scenario-form-group">
              <label htmlFor="create-title" className="scenario-form-label">
                Názov úlohy *
              </label>
              <Input
                id="create-title"
                placeholder="napr. Základný tréning - Urgentné stavy"
                value={createFormData.title}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, title: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-description"
                className="scenario-form-label"
              >
                Popis
              </label>
              <Input
                id="create-description"
                as="textarea"
                rows={2}
                placeholder="Popíšte účel tejto úlohy..."
                value={createFormData.description}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, description: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-scenario" className="scenario-form-label">
                Scenár *
              </label>
              <SelectPicker
                id="create-scenario"
                data={scenarioOptions}
                value={createFormData.scenarioId}
                onChange={(value: string | null) =>
                  setCreateFormData({
                    ...createFormData,
                    scenarioId: value || "",
                  })
                }
                block
                placeholder="Vyberte scenár"
                renderMenuItem={(label, item: ScenarioResponse | unknown) => {
                  const scenario = item as ScenarioResponse | undefined;
                  return (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <span>{label}</span>
                      {scenario && (
                        <span style={{ display: "flex", gap: 8 }}>
                          {scenario.status && (
                            <span style={statusPillStyle(scenario.status)}>
                              {getStatusLabel(scenario.status)}
                            </span>
                          )}
                          {scenario.severity && (
                            <span style={severityPillStyle(scenario.severity)}>
                              {getSeverityLabel(scenario.severity)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-deadline" className="scenario-form-label">
                Termín *
              </label>
              <DatePicker
                id="create-deadline"
                format="dd. MM. yyyy"
                placeholder="dd. mm. rrrr"
                value={createFormData.deadline}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, deadline: value })
                }
                block
              />
            </div>

            <div className="scenario-form-row">
              <div className="scenario-form-group">
                <label
                  htmlFor="create-min-score"
                  className="scenario-form-label"
                >
                  Minimálne skóre (%)
                </label>
                <InputNumber
                  id="create-min-score"
                  min={0}
                  max={100}
                  value={createFormData.minScore}
                  onChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      minScore: Number(value) || 75,
                    })
                  }
                />
              </div>

              <div className="scenario-form-group">
                <label
                  htmlFor="create-max-attempts"
                  className="scenario-form-label"
                >
                  Max. počet pokusov
                </label>
                <InputNumber
                  id="create-max-attempts"
                  min={1}
                  max={10}
                  value={createFormData.maxAttempts}
                  onChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      maxAttempts: Number(value) || 3,
                    })
                  }
                />
              </div>
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-operators" className="scenario-form-label">
                Priradiť používateľom *
              </label>
              <TagPicker
                id="create-operators"
                data={operatorOptions}
                value={createFormData.operatorIds}
                onChange={(value: number[]) =>
                  setCreateFormData({
                    ...createFormData,
                    operatorIds: value || [],
                  })
                }
                block
                placeholder={
                  users ? "Vyberte používateľov" : "Načítavam používateľov..."
                }
                disabled={!users}
              />
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <TagPicker
                  data={kosOptions}
                  value={selectedKos}
                  onChange={(value) => {
                    const selected = value || [];
                    setSelectedKos(selected);
                    if (selected.length > 0) {
                      const kosOperators = Array.from(
                        new Set(
                          (users || [])
                            .filter(
                              (u: UserResponse) =>
                                u.role === "OPERATOR" &&
                                selected.includes(u.organization || ""),
                            )
                            .map((u: UserResponse) => u.id),
                        ),
                      );
                      setCreateFormData((prev) => ({
                        ...prev,
                        operatorIds: kosOperators,
                      }));
                    } else {
                      setCreateFormData((prev) => ({
                        ...prev,
                        operatorIds: [],
                      }));
                    }
                  }}
                  placeholder="Vyberte organizácie KOS"
                  searchable={false}
                  style={{ minWidth: 280 }}
                  disabled={!users}
                  cleanable
                  menuClassName="kos-multiselect"
                />
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button
                    size="sm"
                    appearance="ghost"
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                    onClick={() => {
                      setSelectedKos([]);
                      setCreateFormData({
                        ...createFormData,
                        operatorIds: (users || [])
                          .filter((u: UserResponse) => u.role === "OPERATOR")
                          .map((u: UserResponse) => u.id),
                      });
                    }}
                  >
                    Vybrať všetkých
                  </Button>
                  <Button
                    size="sm"
                    appearance="subtle"
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                    onClick={() => {
                      setSelectedKos([]);
                      setCreateFormData({ ...createFormData, operatorIds: [] });
                    }}
                  >
                    Zrušiť výber
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setCreateModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            onClick={handleCreate}
            appearance="primary"
            color="red"
            disabled={
              !min3(createFormData.title) ||
              (createFormData.description &&
                !min3(createFormData.description)) ||
              !createFormData.scenarioId ||
              !createFormData.deadline ||
              createFormData.operatorIds.length === 0
            }
          >
            {editingTaskId ? "Upraviť úlohu" : "Vytvoriť úlohu"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Detail priradenej úlohy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div className="scenario-detail">
              <div className="scenario-detail-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{selectedTask.title}</h3>
                  <span
                    className={`scenario-status-badge ${getStatusBadgeClass(selectedTask.status)}`}
                  >
                    {getStatusLabel(selectedTask.status)}
                  </span>
                </div>
                {selectedTask.description && (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.5",
                    }}
                  >
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="scenario-detail-body">
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Scenár:</span>
                  <span className="scenario-detail-value">
                    {selectedTask.scenario.title}
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Termín:</span>
                  <span className="scenario-detail-value">
                    {formatDate(selectedTask.deadline)}
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">
                    Minimálne skóre:
                  </span>
                  <span className="scenario-detail-value">
                    {selectedTask.minScore}%
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Max. pokusy:</span>
                  <span className="scenario-detail-value">
                    {selectedTask.maxAttempts}
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Pokrok:</span>
                  <span className="scenario-detail-value">
                    Dokončené {selectedTask.progress.completed} /{" "}
                    {selectedTask.progress.total}
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">
                    Priradení operátori ({selectedTask.assignedOperators.length}
                    ):
                  </span>
                  <div style={{ marginTop: "8px" }}>
                    {selectedTask.assignedOperators.map((op) => (
                      <div
                        key={op.id}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>
                          {op.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>
                          {op.email}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setDetailModal(false)} appearance="subtle">
            Zavrieť
          </Button>
          <Button
            onClick={() => selectedTask && handleOpenEdit(selectedTask)}
            appearance="primary"
            color="red"
          >
            Upraviť
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} size="xs">
        <Modal.Header>
          <Modal.Title>Odstrániť úlohu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <p>
              Naozaj chcete odstrániť úlohu{" "}
              <strong>{selectedTask.title}</strong>? Táto akcia je nenávratná.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setDeleteModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button onClick={handleDelete} appearance="primary" color="red">
            Odstrániť
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </div>
  );
}
