"use client";

import EyeIcon from "@rsuite/icons/Detail";
import EditIcon from "@rsuite/icons/Edit";
import PlusIcon from "@rsuite/icons/Plus";
import SearchIcon from "@rsuite/icons/Search";
import TrashIcon from "@rsuite/icons/Trash";
import {
  type ChangeEvent,
  type DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Input,
  InputGroup,
  Loader,
  Message,
  Modal,
  SelectPicker,
  TagPicker,
  useToaster,
} from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import {
  useCreateScenario,
  useDeleteScenario,
  useScenarios,
  useUpdateScenario,
} from "@/hooks/useScenarios";
import type { ScenarioResponse } from "@/types";
import Footer from "../../components/Footer";

interface Scenario {
  id: string;
  title: string;
  caller: string;
  age: number;
  duration: string;
  symptoms: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "INACTIVE";
  situation?: string;
  patientState?: string;
  hiddenCause?: string;
  callerBehavior?: string;
  dispatcherGoal?: string;
  keyFacts?: string;
  responseStyle?: string;
  description?: string;
  instructions?: string;
}

// Helper function to map API response to local interface
function mapScenarioFromApi(apiScenario: ScenarioResponse): Scenario {
  return {
    id: apiScenario.id,
    title: apiScenario.title,
    caller: apiScenario.caller,
    age: apiScenario.age,
    duration: apiScenario.duration,
    symptoms: apiScenario.symptoms,
    severity: apiScenario.severity,
    status: apiScenario.status,
    situation: apiScenario.situation,
    patientState: apiScenario.patient_state,
    hiddenCause: apiScenario.hidden_cause,
    callerBehavior: apiScenario.caller_behavior,
    dispatcherGoal: apiScenario.dispatcher_goal,
    keyFacts: apiScenario.key_facts,
    responseStyle: apiScenario.response_style,
    description: apiScenario.description,
    instructions: apiScenario.instructions,
  };
}

// Helper function to map form data to API format
// Form data shape used by create/edit forms
interface ScenarioFormData {
  title: string;
  caller: string;
  age: string; // stored as string in the form inputs
  duration: string;
  symptoms: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "INACTIVE";
  situation: string;
  patientState: string;
  hiddenCause: string;
  callerBehavior: string;
  dispatcherGoal: string;
  keyFacts: string;
  responseStyle: string;
  description?: string;
  instructions?: string;
}

// API payload shape
interface ApiScenarioPayload {
  title: string;
  caller: string;
  age: number;
  duration: string;
  symptoms: string[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "INACTIVE";
  situation?: string;
  patient_state?: string;
  hidden_cause?: string;
  caller_behavior?: string;
  dispatcher_goal?: string;
  key_facts?: string;
  response_style?: string;
  description?: string;
  instructions?: string;
}

// Basic parser for the #SECTION text template used for bulk-filling the create form
function parseScenarioTemplate(content: string): Partial<ScenarioFormData> {
  const sections: Record<string, string> = {};

  // Support headers like "#TITLE: text" or "#TITLE" followed by lines until next header
  const lines = content.split(/\r?\n/);
  let currentKey: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey) {
      sections[currentKey] = buffer.join("\n").trim();
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headerMatch = line.match(/^#([A-Z_]+)\s*:?\s*(.*)$/);

    if (headerMatch) {
      flush();
      currentKey = headerMatch[1];
      const inline = headerMatch[2];
      buffer = inline ? [inline] : [];
    } else if (currentKey) {
      buffer.push(rawLine); // keep original spacing inside body
    }
  }

  flush();

  const parsed: Partial<ScenarioFormData> = {};

  if (sections.TITLE) parsed.title = sections.TITLE;
  if (sections.SITUATION) parsed.situation = sections.SITUATION;
  if (sections.CALLER) parsed.caller = sections.CALLER;
  if (sections.PATIENT_STATE) parsed.patientState = sections.PATIENT_STATE;
  if (sections.HIDDEN_CAUSE) parsed.hiddenCause = sections.HIDDEN_CAUSE;
  if (sections.CALLER_BEHAVIOR)
    parsed.callerBehavior = sections.CALLER_BEHAVIOR;
  if (sections.DISPATCHER_GOAL)
    parsed.dispatcherGoal = sections.DISPATCHER_GOAL;
  if (sections.KEY_FACTS) parsed.keyFacts = sections.KEY_FACTS;
  if (sections.RESPONSE_STYLE) parsed.responseStyle = sections.RESPONSE_STYLE;
  if (sections.DESCRIPTION) parsed.description = sections.DESCRIPTION;
  if (sections.INSTRUCTIONS) parsed.instructions = sections.INSTRUCTIONS;

  if (sections.SYMPTOMS) {
    parsed.symptoms = sections.SYMPTOMS.split(/\n+/)
      .map((line) => line.replace(/^[-\s]+/, "").trim())
      .filter(Boolean);
  }

  return parsed;
}

function mapScenarioToApi(formData: ScenarioFormData): ApiScenarioPayload {
  return {
    title: formData.title,
    caller: formData.caller,
    age: Number(formData.age),
    duration: formData.duration,
    symptoms: formData.symptoms,
    severity: formData.severity,
    status: formData.status,
    situation: formData.situation || undefined,
    patient_state: formData.patientState || undefined,
    hidden_cause: formData.hiddenCause || undefined,
    caller_behavior: formData.callerBehavior || undefined,
    dispatcher_goal: formData.dispatcherGoal || undefined,
    key_facts: formData.keyFacts || undefined,
    response_style: formData.responseStyle || undefined,
    description: formData.description || undefined,
    instructions: formData.instructions || undefined,
  };
}

export default function ScenariosManagementPage() {
  const toaster = useToaster();

  // API hooks
  const { data: scenariosData, isLoading } = useScenarios();
  const createScenarioMutation = useCreateScenario();
  const updateScenarioMutation = useUpdateScenario();
  const deleteScenarioMutation = useDeleteScenario();

  // Map API data to local format
  const scenarios = useMemo(() => {
    if (!scenariosData) return [];
    return scenariosData.map(mapScenarioFromApi);
  }, [scenariosData]);

  const [searchValue, setSearchValue] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    "ALL" | "CRITICAL" | "HIGH" | "MEDIUM"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );

  const [deleteModal, setDeleteModal] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    title: "",
    caller: "",
    age: "",
    duration: "",
    symptoms: [] as string[],
    severity: "MEDIUM" as "CRITICAL" | "HIGH" | "MEDIUM",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    situation: "",
    patientState: "",
    hiddenCause: "",
    callerBehavior: "",
    dispatcherGoal: "",
    keyFacts: "",
    responseStyle: "",
    description: "",
    instructions: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    caller: "",
    age: "",
    duration: "",
    symptoms: [] as string[],
    severity: "MEDIUM" as "CRITICAL" | "HIGH" | "MEDIUM",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    situation: "",
    patientState: "",
    hiddenCause: "",
    callerBehavior: "",
    dispatcherGoal: "",
    keyFacts: "",
    responseStyle: "",
    description: "",
    instructions: "",
  });

  const filteredScenarios = useMemo(() => {
    if (!scenarios) return [];

    return scenarios.filter((scenario) => {
      const query = searchValue.toLowerCase();
      const matchesText =
        !query ||
        scenario.title.toLowerCase().includes(query) ||
        scenario.caller.toLowerCase().includes(query) ||
        scenario.symptoms.some((s) => s.toLowerCase().includes(query));

      const matchesSeverity =
        severityFilter === "ALL" || scenario.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" || scenario.status === statusFilter;

      return matchesText && matchesSeverity && matchesStatus;
    });
  }, [scenarios, searchValue, severityFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!scenarios)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        critical: 0,
        high: 0,
        medium: 0,
      };

    return {
      total: scenarios.length,
      active: scenarios.filter((s) => s.status === "ACTIVE").length,
      inactive: scenarios.filter((s) => s.status === "INACTIVE").length,
      critical: scenarios.filter((s) => s.severity === "CRITICAL").length,
      high: scenarios.filter((s) => s.severity === "HIGH").length,
      medium: scenarios.filter((s) => s.severity === "MEDIUM").length,
    };
  }, [scenarios]);

  const handleOpenCreate = () => {
    setCreateFormData({
      title: "",
      caller: "",
      age: "",
      duration: "",
      symptoms: [],
      severity: "MEDIUM",
      status: "ACTIVE",
      situation: "",
      patientState: "",
      hiddenCause: "",
      callerBehavior: "",
      dispatcherGoal: "",
      keyFacts: "",
      responseStyle: "",
      description: "",
      instructions: "",
    });
    setCreateModal(true);
  };

  const handleOpenEdit = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setEditFormData({
      title: scenario.title,
      caller: scenario.caller,
      age: scenario.age.toString(),
      duration: scenario.duration,
      symptoms: scenario.symptoms,
      severity: scenario.severity,
      status: scenario.status,
      situation: scenario.situation || "",
      patientState: scenario.patientState || "",
      hiddenCause: scenario.hiddenCause || "",
      callerBehavior: scenario.callerBehavior || "",
      dispatcherGoal: scenario.dispatcherGoal || "",
      keyFacts: scenario.keyFacts || "",
      responseStyle: scenario.responseStyle || "",
      description: scenario.description || "",
      instructions: scenario.instructions || "",
    });
    setEditModal(true);
  };

  const handleOpenDelete = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setDeleteModal(true);
  };

  const handleOpenDetail = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setDetailModal(true);
  };

  const handleCreate = async () => {
    try {
      const apiData = mapScenarioToApi(createFormData);
      await createScenarioMutation.mutateAsync(apiData);

      toaster.push(
        <Message showIcon type="success">
          Scenár bol úspešne vytvorený
        </Message>,
        { placement: "topEnd" },
      );
      setCreateModal(false);
    } catch (error) {
      toaster.push(
        <Message showIcon type="error">
          Chyba pri vytváraní scenára:{" "}
          {error instanceof Error ? error.message : "Neznáma chyba"}
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const handleUpdate = async () => {
    if (!selectedScenario) return;

    try {
      const apiData = mapScenarioToApi(editFormData);
      await updateScenarioMutation.mutateAsync({
        scenarioId: selectedScenario.id,
        data: apiData,
      });

      toaster.push(
        <Message showIcon type="success">
          Scenár bol úspešne upravený
        </Message>,
        { placement: "topEnd" },
      );
      setEditModal(false);
      setSelectedScenario(null);
    } catch (error) {
      toaster.push(
        <Message showIcon type="error">
          Chyba pri upravovaní scenára:{" "}
          {error instanceof Error ? error.message : "Neznáma chyba"}
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedScenario) return;

    try {
      await deleteScenarioMutation.mutateAsync(selectedScenario.id);

      toaster.push(
        <Message showIcon type="success">
          Scenár bol odstránený
        </Message>,
        { placement: "topEnd" },
      );
      setDeleteModal(false);
      setSelectedScenario(null);
    } catch (error) {
      toaster.push(
        <Message showIcon type="error">
          Chyba pri mazaní scenára:{" "}
          {error instanceof Error ? error.message : "Neznáma chyba"}
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const min3 = (v: string | undefined | null) =>
    !!v && v.toString().trim().length >= 3;

  const minDuration = (v: string) => {
    const num = Number(v);
    return Number.isFinite(num) && num >= 10;
  };

  const handleTemplateButtonClick = () => {
    fileInputRef.current?.click();
  };

  const readTemplateFile = (file: File, onFinish?: () => void) => {
    if (!file.name.toLowerCase().endsWith(".txt")) {
      toaster.push(
        <Message showIcon type="error">
          Prosím, nahrajte súbor vo formáte .txt
        </Message>,
        { placement: "topEnd" },
      );
      onFinish?.();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";

      if (!text.trim()) {
        toaster.push(
          <Message showIcon type="error">
            Súbor je prázdny alebo sa ho nepodarilo načítať
          </Message>,
          { placement: "topEnd" },
        );
        onFinish?.();
        return;
      }

      const parsed = parseScenarioTemplate(text);

      if (Object.keys(parsed).length === 0) {
        toaster.push(
          <Message showIcon type="error">
            Súbor neobsahuje podporované sekcie (#TITLE, #SITUATION,...)
          </Message>,
          { placement: "topEnd" },
        );
        onFinish?.();
        return;
      }

      setCreateFormData((prev) => ({ ...prev, ...parsed }));

      toaster.push(
        <Message showIcon type="success">
          Údaje zo súboru boli pridané do formulára
        </Message>,
        { placement: "topEnd" },
      );

      onFinish?.();
    };

    reader.onerror = () => {
      toaster.push(
        <Message showIcon type="error">
          Nepodarilo sa načítať súbor
        </Message>,
        { placement: "topEnd" },
      );
      onFinish?.();
    };

    reader.readAsText(file, "utf-8");
  };

  const handleTemplateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const resetInput = () => {
      event.target.value = "";
    };

    readTemplateFile(file, resetInput);
  };

  const handleTemplateDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraggingTemplate) setIsDraggingTemplate(true);
  };

  const handleTemplateDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingTemplate(false);
  };

  const handleTemplateDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingTemplate(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    readTemplateFile(file);
  };

  if (isLoading) {
    return (
      <div className="users-loader-container">
        <Loader size="lg" content="Načítavam scenáre..." />
      </div>
    );
  }

  const severityOptions = [
    { label: "Stredný", value: "MEDIUM" },
    { label: "Vysoký", value: "HIGH" },
    { label: "Kritický", value: "CRITICAL" },
  ];

  const severityFilterOptions = [
    { label: "Všetky priority", value: "ALL" },
    ...severityOptions,
  ];

  const statusOptions = [
    { label: "Aktívny", value: "ACTIVE" },
    { label: "Neaktívny", value: "INACTIVE" },
  ];

  const statusFilterOptions = [
    { label: "Všetky statusy", value: "ALL" },
    ...statusOptions,
  ];

  const symptomOptions = [
    { label: "Tlak na hrudníku", value: "Tlak na hrudníku" },
    { label: "Dýchavičnosť", value: "Dýchavičnosť" },
    { label: "Sťažené dýchanie", value: "Sťažené dýchanie" },
    { label: "Lapanie po dychu", value: "Lapanie po dychu" },
    { label: "Rýchle dýchanie", value: "Rýchle dýchanie" },
    { label: "Prerušovane dýchanie", value: "Prerušovane dýchanie" },
    { label: "Nemožnosť sa nadýchnuť", value: "Nemožnosť sa nadýchnuť" },
    { label: "Bolesť chrbtica", value: "Bolesť chrbtica" },
    { label: "Nemôže vstať", value: "Nemôže vstať" },
    { label: "Opuch tváre", value: "Opuch tváre" },
    { label: "Nevoľnosť", value: "Nevoľnosť" },
    { label: "Bolesť hlavy", value: "Bolesť hlavy" },
    { label: "Závrat", value: "Závrat" },
    { label: "Vyrážka", value: "Vyrážka" },
    { label: "Panika", value: "Panika" },
    { label: "Úzkosť", value: "Úzkosť" },
    { label: "Trasenie", value: "Trasenie" },
    { label: "Vystrašenosť", value: "Vystrašenosť" },
    { label: "Začervenanie tváre", value: "Začervenanie tváre" },
    { label: "Prerušovaný hlas", value: "Prerušovaný hlas" },
    { label: "Šeptanie", value: "Šeptanie" },
    { label: "Držanie za hruď", value: "Držanie za hruď" },
  ];

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

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "scenario-severity-critical";
      case "HIGH":
        return "scenario-severity-high";
      case "MEDIUM":
        return "scenario-severity-medium";
      default:
        return "";
    }
  };

  return (
    <div className="pageBackground">
      {/* Header */}
      <DashboardHeader userName="Admin" userRole="Admin" />

      {/* Content */}
      <div className="scenarios-content">
        <div className="scenarios-title-bar">
          <h2 className="scenarios-page-title">Správa scenárov</h2>
          <Button
            appearance="primary"
            color="red"
            startIcon={<PlusIcon />}
            onClick={handleOpenCreate}
          >
            Pridať scenár
          </Button>
        </div>

        {/* Stats */}
        <div className="scenarios-stats-grid">
          <button
            type="button"
            className="scenarios-stat-card is-total"
            onClick={() => {
              setSeverityFilter("ALL");
              setStatusFilter("ALL");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSeverityFilter("ALL");
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Celkovo scenárov</h3>
            <p className="scenarios-stat-value">{stats.total}</p>
          </button>

          <button
            type="button"
            className="scenarios-stat-card is-status"
            onClick={() => {
              setSeverityFilter("ALL");
              if (statusFilter === "ALL") {
                setStatusFilter("ACTIVE");
              } else if (statusFilter === "ACTIVE") {
                setStatusFilter("INACTIVE");
              } else {
                setStatusFilter("ALL");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSeverityFilter("ALL");
                if (statusFilter === "ALL") {
                  setStatusFilter("ACTIVE");
                } else if (statusFilter === "ACTIVE") {
                  setStatusFilter("INACTIVE");
                } else {
                  setStatusFilter("ALL");
                }
              }
            }}
          >
            <h3 className="scenarios-stat-label">Aktívne / Neaktívne</h3>
            <div className="scenarios-stat-dual">
              <p className="scenarios-stat-value scenarios-stat-value-active">
                {stats.active}
              </p>
              <span className="scenarios-stat-divider">/</span>
              <p className="scenarios-stat-subvalue scenarios-stat-value-inactive">
                {stats.inactive}
              </p>
            </div>
          </button>

          <button
            type="button"
            className="scenarios-stat-card scenarios-stat-card-compact is-critical"
            onClick={() => {
              setSeverityFilter(
                severityFilter === "CRITICAL" ? "ALL" : "CRITICAL",
              );
              setStatusFilter("ALL");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSeverityFilter(
                  severityFilter === "CRITICAL" ? "ALL" : "CRITICAL",
                );
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Kritických</h3>
            <p className="scenarios-stat-value scenarios-stat-value-critical">
              {stats.critical}
            </p>
          </button>

          <button
            type="button"
            className="scenarios-stat-card scenarios-stat-card-compact is-high"
            onClick={() => {
              setSeverityFilter(severityFilter === "HIGH" ? "ALL" : "HIGH");
              setStatusFilter("ALL");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSeverityFilter(severityFilter === "HIGH" ? "ALL" : "HIGH");
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Vysokých</h3>
            <p className="scenarios-stat-value scenarios-stat-value-high">
              {stats.high}
            </p>
          </button>

          <button
            type="button"
            className="scenarios-stat-card scenarios-stat-card-compact is-medium"
            onClick={() => {
              setSeverityFilter(severityFilter === "MEDIUM" ? "ALL" : "MEDIUM");
              setStatusFilter("ALL");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSeverityFilter(
                  severityFilter === "MEDIUM" ? "ALL" : "MEDIUM",
                );
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Stredných</h3>
            <p className="scenarios-stat-value scenarios-stat-value-medium">
              {stats.medium}
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
                placeholder="Hľadať scenár..."
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
            data={severityFilterOptions}
            value={severityFilter}
            onChange={(value) =>
              setSeverityFilter(value as "ALL" | "CRITICAL" | "HIGH" | "MEDIUM")
            }
            searchable={false}
            cleanable={false}
            style={{ minWidth: 180 }}
            placeholder="Filtrovať priority"
          />
          <SelectPicker
            data={statusFilterOptions}
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            searchable={false}
            cleanable={false}
            style={{ minWidth: 180 }}
            placeholder="Filtrovať status"
          />
        </div>

        {/* Scenarios Cards */}
        <div className="scenarios-cards-grid">
          {filteredScenarios.length === 0 ? (
            <div className="scenarios-empty">
              <p>Žiadne scenáre</p>
            </div>
          ) : (
            filteredScenarios.map((scenario) => (
              <div key={scenario.id} className="scenario-card">
                <div className="scenario-card-header">
                  <h3 className="scenario-card-title">{scenario.title}</h3>
                  <div className="scenario-card-badges">
                    <span
                      className={`scenario-severity-badge ${getSeverityBadgeClass(scenario.severity)}`}
                    >
                      <svg
                        aria-label="Ikona priority"
                        role="img"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <title>Ikona priority</title>
                        <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" />
                      </svg>
                      {getSeverityLabel(scenario.severity)}
                    </span>
                    <span
                      className={`scenario-status-badge ${scenario.status === "ACTIVE" ? "scenario-status-active" : "scenario-status-inactive"}`}
                    >
                      {scenario.status === "ACTIVE" ? "Aktívny" : "Neaktívny"}
                    </span>
                  </div>
                  {scenario.situation && (
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "14px",
                        color: "#6b7280",
                        lineHeight: "1.5",
                        fontWeight: "normal",
                      }}
                    >
                      {scenario.situation}
                    </p>
                  )}
                </div>

                <div className="scenario-card-body">
                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Vek:</p>
                    <p className="scenario-card-value">{scenario.age} rokov</p>
                  </div>

                  <div className="scenario-card-info">
                    <p className="scenario-card-label">Trvanie:</p>
                    <p className="scenario-card-value">{scenario.duration}</p>
                  </div>

                  <div className="scenario-card-symptoms">
                    <p className="scenario-card-label">Symptómy:</p>
                    <div className="scenario-symptoms-tags">
                      {scenario.symptoms.slice(0, 2).map((symptom) => (
                        <span key={symptom} className="scenario-symptom-tag">
                          {symptom}
                        </span>
                      ))}
                      {scenario.symptoms.length > 2 && (
                        <span className="scenario-symptom-tag scenario-symptom-more">
                          +{scenario.symptoms.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="scenario-card-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(scenario)}
                    className="scenario-action-btn scenario-action-detail"
                  >
                    <EyeIcon style={{ fontSize: "16px" }} />
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(scenario)}
                    className="scenario-action-btn scenario-action-edit"
                  >
                    <EditIcon style={{ fontSize: "16px" }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(scenario)}
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

      {/* Create Scenario Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        size="sm"
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>Pridať nový scenár</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Vytvorte nový tréningový scenár pre operátorov
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
            onChange={handleTemplateInputChange}
          />
          <button
            type="button"
            onDragOver={handleTemplateDragOver}
            onDragEnter={handleTemplateDragOver}
            onDragLeave={handleTemplateDragLeave}
            onDrop={handleTemplateDrop}
            onClick={handleTemplateButtonClick}
            style={{
              border: "1px dashed #d1d5db",
              borderColor: isDraggingTemplate ? "#ef4444" : "#d1d5db",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              background: isDraggingTemplate ? "#fff6f5" : "#fff",
              color: "#4b5563",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#111827",
                }}
              >
                Pretiahnite .txt súbor sem
              </div>
              <div style={{ color: "#6b7280" }}>
                alebo kliknite sem na výber súboru
              </div>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: isDraggingTemplate ? "#ef4444" : "#9ca3af",
                whiteSpace: "nowrap",
              }}
            >
              Podporované: .txt
            </div>
          </button>
          <div className="scenario-modal-form">
            <div className="scenario-form-group">
              <label htmlFor="create-title" className="scenario-form-label">
                Názov scenára
              </label>
              <Input
                id="create-title"
                placeholder="Zadajte názov scenára"
                value={createFormData.title}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, title: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-age" className="scenario-form-label">
                Vek pacienta
              </label>
              <Input
                id="create-age"
                type="number"
                placeholder="0"
                value={createFormData.age}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, age: value })
                }
              />
            </div>

            <div className="scenario-form-row">
              <div className="scenario-form-group">
                <label
                  htmlFor="create-severity"
                  className="scenario-form-label"
                >
                  Priorita
                </label>
                <SelectPicker
                  id="create-severity"
                  data={severityOptions}
                  value={createFormData.severity}
                  onChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      severity: value as "CRITICAL" | "HIGH" | "MEDIUM",
                    })
                  }
                  block
                  searchable={false}
                  cleanable={false}
                  placeholder="Stredný"
                />
              </div>

              <div className="scenario-form-group">
                <label
                  htmlFor="create-duration"
                  className="scenario-form-label"
                >
                  Očakávané trvanie
                </label>
                <Input
                  id="create-duration"
                  type="number"
                  min={10}
                  placeholder="Min. 10 minút"
                  value={createFormData.duration}
                  onChange={(value) =>
                    setCreateFormData({ ...createFormData, duration: value })
                  }
                />
              </div>
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-status" className="scenario-form-label">
                Status
              </label>
              <SelectPicker
                id="create-status"
                data={statusOptions}
                value={createFormData.status}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    status: value as "ACTIVE" | "INACTIVE",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-situation" className="scenario-form-label">
                Popis situácie
              </label>
              <Input
                id="create-situation"
                as="textarea"
                rows={3}
                placeholder="Opíšte základnú situáciu, v ktorej sa nachádzajú účastníci..."
                value={createFormData.situation}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, situation: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-caller" className="scenario-form-label">
                Kto volá
              </label>
              <Input
                id="create-caller"
                as="textarea"
                rows={2}
                placeholder="napr. Samotná pacientka, Manželka pacienta, Svedok..."
                value={createFormData.caller}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, caller: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-patient-state"
                className="scenario-form-label"
              >
                Stav pacienta
              </label>
              <Input
                id="create-patient-state"
                as="textarea"
                rows={3}
                placeholder="Opíšte aktuálny stav pacienta, symptómy, správanie..."
                value={createFormData.patientState}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, patientState: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-hidden-cause"
                className="scenario-form-label"
              >
                Skrytá príčina
              </label>
              <Input
                id="create-hidden-cause"
                as="textarea"
                rows={3}
                placeholder="Skutočná príčina problému, ktorú operátor musí odhaliť..."
                value={createFormData.hiddenCause}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, hiddenCause: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-caller-behavior"
                className="scenario-form-label"
              >
                Správanie volajúceho
              </label>
              <Input
                id="create-caller-behavior"
                as="textarea"
                rows={3}
                placeholder="Ako má volajúci komunikovať, reagovať na otázky..."
                value={createFormData.callerBehavior}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    callerBehavior: value,
                  })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-dispatcher-goal"
                className="scenario-form-label"
              >
                Cieľ operátora
              </label>
              <Input
                id="create-dispatcher-goal"
                as="textarea"
                rows={3}
                placeholder="Čo má operátor zistiť a urobiť..."
                value={createFormData.dispatcherGoal}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    dispatcherGoal: value,
                  })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-key-facts" className="scenario-form-label">
                Kľúčové fakty
              </label>
              <Input
                id="create-key-facts"
                as="textarea"
                rows={4}
                placeholder="- Pacientka: žena, 30 rokov&#10;- Miesto: park, po behu&#10;- Symptómy: sťažené dýchanie, panika, úzkosť&#10;- Diagnóza: astma, bez inhalátora&#10;- Cieľ: rozpoznať astmatický záchvat..."
                value={createFormData.keyFacts}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, keyFacts: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="create-response-style"
                className="scenario-form-label"
              >
                Štýl odpovedí
              </label>
              <Input
                id="create-response-style"
                as="textarea"
                rows={4}
                placeholder="Odpovede majú byť krátke, prerušované, často nedokončené.&#10;Majú obsahovať emóciu paniky, ale nie dramatizáciu.&#10;Používaj útržkovité vety, napríklad:&#10;„Ja... nemôžem... dýchať..."
                value={createFormData.responseStyle}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, responseStyle: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="create-symptoms" className="scenario-form-label">
                Symptómy
              </label>
              <TagPicker
                id="create-symptoms"
                data={symptomOptions}
                value={createFormData.symptoms}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    symptoms: value as string[],
                  })
                }
                block
                placeholder="Pridať symptóm"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
              width: "100%",
            }}
          >
            <Button onClick={() => setCreateModal(false)} appearance="subtle">
              Zrušiť
            </Button>
            <Button
              onClick={handleCreate}
              appearance="primary"
              color="red"
              loading={createScenarioMutation.isPending}
              disabled={
                !min3(createFormData.title) ||
                !min3(createFormData.caller) ||
                !createFormData.age ||
                !minDuration(createFormData.duration) ||
                !min3(createFormData.situation) ||
                !min3(createFormData.patientState) ||
                !min3(createFormData.hiddenCause) ||
                !min3(createFormData.callerBehavior) ||
                !min3(createFormData.dispatcherGoal) ||
                !min3(createFormData.keyFacts) ||
                !min3(createFormData.responseStyle) ||
                createFormData.symptoms.length === 0
              }
            >
              Pridať scenár
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Edit Scenario Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        size="sm"
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>Upraviť scenár</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Zmeniť informácie o scenári
          </p>
          <div className="scenario-modal-form">
            <div className="scenario-form-group">
              <label htmlFor="edit-title" className="scenario-form-label">
                Názov scenára
              </label>
              <Input
                id="edit-title"
                placeholder=""
                value={editFormData.title}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, title: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-age" className="scenario-form-label">
                Vek pacienta
              </label>
              <Input
                id="edit-age"
                type="number"
                placeholder="0"
                value={editFormData.age}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, age: value })
                }
              />
            </div>

            <div className="scenario-form-row">
              <div className="scenario-form-group">
                <label htmlFor="edit-severity" className="scenario-form-label">
                  Priorita
                </label>
                <SelectPicker
                  id="edit-severity"
                  data={severityOptions}
                  value={editFormData.severity}
                  onChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      severity: value as "CRITICAL" | "HIGH" | "MEDIUM",
                    })
                  }
                  block
                  searchable={false}
                  cleanable={false}
                />
              </div>

              <div className="scenario-form-group">
                <label htmlFor="edit-duration" className="scenario-form-label">
                  Očakávané trvanie
                </label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={10}
                  placeholder="minúty (min 10)"
                  value={editFormData.duration}
                  onChange={(value) =>
                    setEditFormData({ ...editFormData, duration: value })
                  }
                />
              </div>
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-status" className="scenario-form-label">
                Status
              </label>
              <SelectPicker
                id="edit-status"
                data={statusOptions}
                value={editFormData.status}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    status: value as "ACTIVE" | "INACTIVE",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-situation" className="scenario-form-label">
                Popis situácie
              </label>
              <Input
                id="edit-situation"
                as="textarea"
                rows={3}
                placeholder="Opíšte základnú situáciu, v ktorej sa nachádzajú účastníci..."
                value={editFormData.situation}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, situation: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-caller" className="scenario-form-label">
                Kto volá
              </label>
              <Input
                id="edit-caller"
                as="textarea"
                rows={2}
                placeholder="napr. Samotná pacientka, Manželka pacienta, Svedok..."
                value={editFormData.caller}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, caller: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="edit-patient-state"
                className="scenario-form-label"
              >
                Stav pacienta
              </label>
              <Input
                id="edit-patient-state"
                as="textarea"
                rows={3}
                placeholder="Opíšte aktuálny stav pacienta, symptómy, správanie..."
                value={editFormData.patientState}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, patientState: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="edit-hidden-cause"
                className="scenario-form-label"
              >
                Skrytá príčina
              </label>
              <Input
                id="edit-hidden-cause"
                as="textarea"
                rows={3}
                placeholder="Skutočná príčina problému, ktorú operátor musí odhaliť..."
                value={editFormData.hiddenCause}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, hiddenCause: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="edit-caller-behavior"
                className="scenario-form-label"
              >
                Správanie volajúceho
              </label>
              <Input
                id="edit-caller-behavior"
                as="textarea"
                rows={3}
                placeholder="Ako má volajúci komunikovať, reagovať na otázky..."
                value={editFormData.callerBehavior}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, callerBehavior: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="edit-dispatcher-goal"
                className="scenario-form-label"
              >
                Cieľ operátora
              </label>
              <Input
                id="edit-dispatcher-goal"
                as="textarea"
                rows={3}
                placeholder="Čo má operátor zistiť a urobiť..."
                value={editFormData.dispatcherGoal}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, dispatcherGoal: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-key-facts" className="scenario-form-label">
                Kľúčové fakty
              </label>
              <Input
                id="edit-key-facts"
                as="textarea"
                rows={4}
                placeholder="- Pacientka: žena, 30 rokov&#10;- Miesto: park, po behu&#10;- Symptómy: sťažené dýchanie, panika, úzkosť&#10;- Diagnóza: astma, bez inhalátora&#10;- Cieľ: rozpoznať astmatický záchvat..."
                value={editFormData.keyFacts}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, keyFacts: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label
                htmlFor="edit-response-style"
                className="scenario-form-label"
              >
                Štýl odpovedí
              </label>
              <Input
                id="edit-response-style"
                as="textarea"
                rows={4}
                placeholder="Odpovede majú byť krátke, prerušované, často nedokončené.&#10;Majú obsahovať emóciu paniky, ale nie dramatizáciu.&#10;Používaj útržkovité vety, napríklad:&#10;„Ja... nemôžem... dýchať..."
                value={editFormData.responseStyle}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, responseStyle: value })
                }
              />
            </div>

            <div className="scenario-form-group">
              <label htmlFor="edit-symptoms" className="scenario-form-label">
                Symptómy
              </label>
              <TagPicker
                id="edit-symptoms"
                data={symptomOptions}
                value={editFormData.symptoms}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    symptoms: value as string[],
                  })
                }
                block
                placeholder="Pridať symptóm"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setEditModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            onClick={handleUpdate}
            appearance="primary"
            color="red"
            loading={updateScenarioMutation.isPending}
            disabled={
              !min3(editFormData.title) ||
              !min3(editFormData.caller) ||
              !editFormData.age ||
              !minDuration(editFormData.duration) ||
              !min3(editFormData.situation) ||
              !min3(editFormData.patientState) ||
              !min3(editFormData.hiddenCause) ||
              !min3(editFormData.callerBehavior) ||
              !min3(editFormData.dispatcherGoal) ||
              !min3(editFormData.keyFacts) ||
              !min3(editFormData.responseStyle) ||
              editFormData.symptoms.length === 0
            }
          >
            Uložiť zmeny
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Detail scenára</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedScenario && (
            <div className="scenario-detail">
              <div className="scenario-detail-header">
                <h3>{selectedScenario.title}</h3>
                <div className="scenario-detail-badges">
                  <span
                    className={`scenario-severity-badge ${getSeverityBadgeClass(selectedScenario.severity)}`}
                  >
                    <svg
                      aria-label="Ikona priority"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <title>Ikona priority</title>
                      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" />
                    </svg>
                    {getSeverityLabel(selectedScenario.severity)}
                  </span>
                  <span
                    className={`scenario-status-badge ${selectedScenario.status === "ACTIVE" ? "scenario-status-active" : "scenario-status-inactive"}`}
                  >
                    {selectedScenario.status === "ACTIVE"
                      ? "Aktívny"
                      : "Neaktívny"}
                  </span>
                </div>
              </div>

              <div className="scenario-detail-body">
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Volajúci:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.caller}
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Vek:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.age} rokov
                  </span>
                </div>
                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Trvanie:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.duration}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Situácia:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.situation || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Stav pacienta:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.patientState || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Skrytá príčina:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.hiddenCause || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">
                    Správanie volajúceho:
                  </span>
                  <span className="scenario-detail-value">
                    {selectedScenario.callerBehavior || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Cieľ operátora:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.dispatcherGoal || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Kľúčové fakty:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.keyFacts || "-"}
                  </span>
                </div>

                <div className="scenario-detail-item">
                  <span className="scenario-detail-label">Štýl odpovedí:</span>
                  <span className="scenario-detail-value">
                    {selectedScenario.responseStyle || "-"}
                  </span>
                </div>

                {selectedScenario.description && (
                  <div className="scenario-detail-item">
                    <span className="scenario-detail-label">
                      Popis situácie:
                    </span>
                    <span className="scenario-detail-value">
                      {selectedScenario.description}
                    </span>
                  </div>
                )}
                {selectedScenario.symptoms &&
                  selectedScenario.symptoms.length > 0 && (
                    <div className="scenario-detail-item">
                      <span className="scenario-detail-label">Symptómy:</span>
                      <div className="scenario-detail-tags">
                        {selectedScenario.symptoms.map((symptom) => (
                          <span key={symptom} className="scenario-symptom-tag">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {selectedScenario.instructions && (
                  <div className="scenario-detail-item">
                    <span className="scenario-detail-label">
                      Inštrukcie prvej pomoci:
                    </span>
                    <span className="scenario-detail-value">
                      {selectedScenario.instructions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setDetailModal(false)} appearance="primary">
            Zavrieť
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Scenario Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} size="xs">
        <Modal.Header>
          <Modal.Title>Odstrániť scenár</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedScenario && (
            <p>
              Naozaj chcete odstrániť scenár "{selectedScenario.title}"? Táto
              akcia sa nedá vrátiť späť.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setDeleteModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            onClick={handleDelete}
            appearance="primary"
            color="red"
            loading={deleteScenarioMutation.isPending}
          >
            Odstrániť
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </div>
  );
}
