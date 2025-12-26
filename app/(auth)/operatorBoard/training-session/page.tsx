"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Loader, Message, Modal, useToaster } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { useEndSimulation, useStartSimulation } from "@/hooks/useSimulate";
import { simulateApi } from "@/lib/api";
import Footer from "../../components/Footer";

declare global {
  interface Window {
    __SIM_START_GUARDS__?: Record<string, boolean>;
  }
}

const claimStartGuard = (key: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  window.__SIM_START_GUARDS__ ??= {};
  const guards = window.__SIM_START_GUARDS__;
  if (!guards) {
    return false;
  }
  if (guards[key]) {
    return true;
  }
  guards[key] = true;
  return false;
};

const releaseStartGuard = (key: string) => {
  if (typeof window === "undefined") {
    return;
  }
  const guards = window.__SIM_START_GUARDS__;
  if (!guards) {
    return;
  }
  delete guards[key];
};

const evaluationLabels: Record<string, string> = {
  accuracy_of_collected_data: "Presnosť údajov",
  operator_expertise: "Odbornosť",
  operator_empathy: "Empatia",
  response_speed: "Rýchlosť reakcie",
  notes_quality: "Kvalita poznámok",
};

function TrainingSessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useMe();

  // Načítanie parametrov z URL (task_id a scenario_title)
  const scenario_title = searchParams.get("scenario_title") || "";
  const task_id = searchParams.get("task_id") || "";

  // Stavy pre simuláciu
  const [sessionId, setSessionId] = useState<string | null>(null); // ID AI session
  const [_attemptId, setAttemptId] = useState<string | null>(null); // ID pokusu v MongoDB
  const [dialogue, setDialogue] = useState<
    Array<{ role: string; message: string; timestamp: string }>
  >([]); // História dialógu
  const [isLoading, setIsLoading] = useState(true);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [simulationResult, setSimulationResult] = useState<{
    score: number;
    status: string;
    evaluation: Record<string, number>;
  } | null>(null);

  // Form state (loaded from backend)
  interface FormData {
    callerName: string;
    callerAge: string | number;
    callerType: string;
    priority: string;
    region: string;
    city: string;
    street: string;
    number: string | number;
    diagnosis: string;
    operatorNotes: string;
    extraUnits: string[];
  }

  const defaultForm: FormData = {
    callerName: "",
    callerAge: "",
    callerType: "",
    priority: "",
    region: "",
    city: "",
    street: "",
    number: "",
    diagnosis: "",
    operatorNotes: "",
    extraUnits: [],
  };

  const [form, setForm] = useState<FormData>(defaultForm);
  const [sidebarWidth, setSidebarWidth] = useState(380); // Šírka sidebaru
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startGuardKey = useMemo(() => {
    if (!user || !scenario_title || !task_id) {
      return null;
    }
    return `${user.id}:${task_id}:${scenario_title}`;
  }, [user, task_id, scenario_title]);

  // React Query hooks pre prácu s AI simuláciou
  const startSimulation = useStartSimulation();
  const endSimulation = useEndSimulation();
  const { mutateAsync: endSimulationAsync } = endSimulation;

  const toaster = useToaster();

  const [callSid, setCallSid] = useState<string | null>(null);

  /**
   * Ukončí simuláciu hovoru.
   * AI automaticky vyhodnotí dialóg, pridelí skóre a určí či operátor uspel.
   * Potom presmeruje späť na zoznam úloh.
   */
  const handleEndCall = useCallback(async () => {
    if (!sessionId) return;
    setIsCallEnded(true);

    try {
      const result = await endSimulationAsync(sessionId);
      setSimulationResult(
        result as {
          score: number;
          status: string;
          evaluation: Record<string, number>;
        },
      );
      setIsResultModalOpen(true);
    } catch (error) {
      console.error("Failed to end simulation:", error);
      toaster.push(
        <Message showIcon type="error">
          Nepodarilo sa ukončiť hovor.
        </Message>,
        { placement: "topEnd" },
      );
    }
  }, [sessionId, endSimulationAsync, toaster]);

  // Auto-scroll pri nových správach
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  // WebSocket connection for live transcripts
  useEffect(() => {
    if (!callSid) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    // Assuming voice-agent is exposed on localhost:5001 (or configured URL)
    // In production, this should be proxied or configured via env
    const wsUrl = `ws://localhost:5001/ws/client/${callSid}`;
    console.log("Connecting to voice agent WS:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to voice agent WS");
      // setConnectionStatus("connected"); // Wait for call_status event
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "call_status") {
          if (data.status === "connected") {
            setConnectionStatus("connected");
          } else if (data.status === "ended") {
            console.log("Call ended via WebSocket event");
            handleEndCall();
          }
        } else if (data.type === "conversation_update") {
          setDialogue((prev) => [
            ...prev,
            {
              role: data.role,
              message: data.content,
              timestamp: new Date().toISOString(),
            },
          ]);

          // Sync with backend for evaluation
          if (sessionId) {
            try {
              await simulateApi.appendMessage(
                sessionId,
                data.role,
                data.content,
              );
            } catch (e) {
              console.error("Failed to sync message to backend:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Voice agent WS error:", err);
      setConnectionStatus("disconnected");
    };

    ws.onclose = () => {
      console.log("Voice agent WS closed");
      setConnectionStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [callSid, sessionId, handleEndCall]);

  /**
   * Spustí AI simuláciu hovoru.
   * Volá /ai/simulate/start, ktorý vytvorí attempt a AI session.
   * Ak už existuje rozbehnutý attempt, obnoví ho.
   */
  const handleStartSimulation = useCallback(async () => {
    if (!user || !scenario_title || !task_id) return;
    if (!startGuardKey) return;

    if (startSimulation.isPending) return;

    if (claimStartGuard(startGuardKey)) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await startSimulation.mutateAsync({
        task_id,
        operator_id: user.id,
        user_email: user.email,
        training: scenario_title,
        practice: true,
        phone_number: user.phone || undefined,
      });

      setSessionId(result.session_id);
      setAttemptId(result.attempt_id);
      setDialogue(result.dialogue || []); // Načíta existujúci dialóg ak je resume

      if (result.call_sid) {
        setCallSid(result.call_sid);
      }

      // populate form from backend response (if present)
      // backend may return `form` optionally — guard the property safely
      const maybeForm = (result as unknown as { form?: Partial<FormData> })
        .form;
      if (maybeForm) {
        setForm((prev: FormData) => ({
          ...prev,
          ...(maybeForm as Partial<FormData>),
        }));
      } else {
        // ensure form keys exist even when backend returns null
        setForm((prev: FormData) => ({ ...prev }));
      }
    } catch (error) {
      console.error("Failed to start simulation:", error);
      toaster.push(
        <Message showIcon type="error">
          Nepodarilo sa spustiť simuláciu.
        </Message>,
        { placement: "topEnd" },
      );
    } finally {
      if (startGuardKey) {
        releaseStartGuard(startGuardKey);
      }
      setIsLoading(false);
    }
  }, [user, scenario_title, task_id, startGuardKey, startSimulation, toaster]);

  // Automaticky spustiť simuláciu pri načítaní stránky
  useEffect(() => {
    if (user && scenario_title && task_id && !sessionId) {
      handleStartSimulation();
    }
  }, [user, scenario_title, task_id, sessionId, handleStartSimulation]);

  // Resize sidebar funkcionalita
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // send form to server on demand
  const sendFormToServer = useCallback(
    async (sid?: string) => {
      const sId = sid || sessionId;
      if (!sId) {
        toaster.push(
          <Message showIcon type="warning">
            Session not started yet.
          </Message>,
          { placement: "topEnd" },
        );
        return;
      }
      try {
        // Use shared API helper so call goes through gateway (NEXT_PUBLIC_GATEWAY_URL)
        // import is dynamic to avoid circular issues in some setups
        const { simulateApi } = await import("@/lib/api");
        const data = await simulateApi.updateForm(sId, form);
        console.info("Form saved:", data);
        toaster.push(
          <Message showIcon type="success">
            Formulár uložený
          </Message>,
          { placement: "topEnd" },
        );
      } catch (e) {
        console.error("Failed to save form:", e);
        toaster.push(
          <Message showIcon type="error">
            Ukladanie formulára zlyhalo. Skontroluj konzolu.
          </Message>,
          { placement: "topEnd" },
        );
      }
    },
    [form, sessionId, toaster],
  );

  // debounce save timer
  const saveTimer = useRef<number | null>(null);
  const DEBOUNCE_MS = 2000;

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    // setTimeout returns number in browsers
    saveTimer.current = window.setTimeout(() => {
      sendFormToServer();
      saveTimer.current = null;
    }, DEBOUNCE_MS) as unknown as number;
  }, [sendFormToServer]);

  const updateFormField = useCallback(
    (
      key: keyof FormData,
      value: FormData[keyof FormData],
      immediate = false,
    ) => {
      setForm((prev: FormData) => ({ ...prev, [key]: value }) as FormData);
      if (immediate) {
        sendFormToServer();
      } else {
        scheduleSave();
      }
    },
    [scheduleSave, sendFormToServer],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 120 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (isLoading) {
    // return (
    //   <div className="pageBackground">
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "center",
    //         alignItems: "center",
    //         height: "100vh",
    //       }}
    //     >
    //       <Loader size="lg" content="Spúšťam simuláciu..." />
    //     </div>
    //   </div>
    // );
  }

  return (
    <div className="pageBackground">
      {/* Header */}
      <DashboardHeader
        userName={user ? `${user.first_name} ${user.last_name}` : ""}
        userRole="Operátor"
      />

      {/* Scenario Container */}
      <div
        style={{
          display: "flex",
          position: "fixed",
          top: "70px",
          bottom: "70px",
          left: 0,
          right: 0,
          backgroundColor: "#f3f4f6",
        }}
      >
        {/* Sidebar */}
        <div
          className="scenarios-sidebar"
          style={{
            width: `${sidebarWidth}px`,
            height: "100%",
            overflowY: "auto",
            padding: "20px",
            backgroundColor: "#ffffff",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "20px",
                  color: "#111827",
                }}
              >
                Záznam hovoru
              </h3>
            </div>

            {/* Sekcia 1: Identifikácia */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="caller-name"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                1. KTO VOLÁ?
              </label>
              <input
                id="caller-name"
                type="text"
                placeholder="Meno"
                value={form.callerName}
                onChange={(e) => updateFormField("callerName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              />
              <input
                id="caller-age"
                type="number"
                placeholder="Vek"
                min="0"
                max="120"
                value={form.callerAge}
                onChange={(e) => updateFormField("callerAge", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Sekcia 2: Typ volajúceho */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                2. KTO JE VOLAJÚCI?
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {[
                  "H1 - Volá sám pacient",
                  "H2 - Volá pre druhého (pri ňom)",
                  "H3 - Volá pre druhého (nie je pri ňom)",
                ].map((option) => {
                  const key = option.split(" ")[0];
                  return (
                    <label
                      key={option}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="caller-type"
                        value={key}
                        checked={form.callerType === key}
                        onChange={() => updateFormField("callerType", key)}
                        style={{ marginRight: "8px", accentColor: "#dc2626" }}
                      />
                      <span style={{ fontSize: "13px", color: "#111827" }}>
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sekcia 3: Priorita */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                3. PRIORITA
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {[
                  { value: "K", label: "K - Kritický" },
                  { value: "N", label: "N - Naliehavý" },
                  { value: "M", label: "M - Menej naliehavý" },
                  { value: "O", label: "O - Odkladný" },
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={form.priority === option.value}
                      onChange={() => updateFormField("priority", option.value)}
                      style={{ marginRight: "8px", accentColor: "#dc2626" }}
                    />
                    <span style={{ fontSize: "13px", color: "#111827" }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sekcia 4: Lokácia */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="location-region"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                4. LOKÁCIA (Automaticky z GPS - overiť!)
              </label>
              <select
                id="location-region"
                value={form.region}
                onChange={(e) => updateFormField("region", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              >
                <option value="">-- Vyberte kraj --</option>
                <option value="Bratislavský">Bratislavský kraj</option>
                <option value="Trnavský">Trnavský kraj</option>
                <option value="Trenčiansky">Trenčiansky kraj</option>
                <option value="Nitriansky">Nitriansky kraj</option>
                <option value="Žilinský">Žilinský kraj</option>
                <option value="Banskobystrický">Banskobystrický kraj</option>
                <option value="Prešovský">Prešovský kraj</option>
                <option value="Košický">Košický kraj</option>
              </select>
              <input
                id="location-city"
                type="text"
                placeholder="Mesto"
                value={form.city}
                onChange={(e) => updateFormField("city", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              />
              <input
                id="location-street"
                type="text"
                placeholder="Ulica"
                value={form.street}
                onChange={(e) => updateFormField("street", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              />
              <input
                id="location-number"
                type="number"
                placeholder="Číslo domu"
                min="0"
                value={form.number}
                onChange={(e) => updateFormField("number", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Sekcia 5: Typ výjazdu */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="departure-type"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                5. TYP VÝJAZDU
              </label>
              <input
                id="departure-type"
                type="text"
                value="Primárny"
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Sekcia 6: Diagnóza pacienta */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="diagnosis"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                6. DIAGNÓZA PACIENTA
              </label>
              <select
                id="diagnosis"
                value={form.diagnosis}
                onChange={(e) => updateFormField("diagnosis", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                }}
              >
                <option value="">-- Vyberte diagnózu --</option>
                <option>Infarkt</option>
                <option>Dopravná nehoda</option>
                <option>Bolesť brucha</option>
                <option>Sťažené dýchanie</option>
                <option>Náhla cievna mozgová príhoda</option>
                <option>Náhle zastavenie obehu</option>
              </select>
              <Button
                appearance="ghost"
                size="sm"
                style={{
                  width: "100%",
                  color: "#dc2626",
                  border: "1px dashed #dc2626",
                }}
              >
                + Pridať ďalšieho pacienta
              </Button>
            </div>

            {/* Sekcia 7: Operátorské upresnenie */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="operator-notes"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                7. OPERÁTORSKÉ UPRESNENIE
              </label>
              <textarea
                id="operator-notes"
                placeholder="Zapíšte všetky dôležité informácie z hovoru..."
                rows={4}
                value={form.operatorNotes}
                onChange={(e) =>
                  updateFormField("operatorNotes", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "13px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Sekcia 8: Ďalšie zložky */}
            <div style={{ marginBottom: "50px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                8. POTREBA ĎALŠÍCH ZLOŽIEK
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {["HaZZ", "PZSR", "MP", "HZS", "VZZS", "KCHL"].map((option) => {
                  const checked =
                    Array.isArray(form.extraUnits) &&
                    form.extraUnits.includes(option);
                  return (
                    <label
                      key={option}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const newUnits = Array.isArray(form.extraUnits)
                            ? [...form.extraUnits]
                            : [];
                          if (e.target.checked) {
                            if (!newUnits.includes(option))
                              newUnits.push(option);
                          } else {
                            const idx = newUnits.indexOf(option);
                            if (idx !== -1) newUnits.splice(idx, 1);
                          }
                          // immediate save for checkbox
                          updateFormField("extraUnits", newUnits, true);
                        }}
                        style={{ marginRight: "8px", accentColor: "#dc2626" }}
                      />
                      <span style={{ fontSize: "13px", color: "#111827" }}>
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          <hr
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "5px",
              margin: 0,
              border: "none",
              cursor: "col-resize",
              backgroundColor: isResizing ? "#dc2626" : "transparent",
              transition: "background-color 0.2s",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              if (!isResizing)
                (e.currentTarget as HTMLHRElement).style.backgroundColor =
                  "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              if (!isResizing)
                (e.currentTarget as HTMLHRElement).style.backgroundColor =
                  "transparent";
            }}
          />
        </div>

        {/* Main Content */}
        <div className="scenarios-main">
          {/* Header with Button */}
          <div className="scenarios-header-with-button">
            <div className="scenarios-live-call-title">
              {scenario_title || "Simulácia hovoru"}
            </div>
          </div>

          {/* Scenario Content */}
          <div className="scenarios-content-wrapper">
            {/* Conversation Window */}
            <div className="scenarios-conversation-large">
              <div className="scenarios-conversation-body">
                {dialogue.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "200px",
                      padding: "40px",
                      textAlign: "center",
                      backgroundColor: "#f0f9ff",
                      border: "2px solid #3b82f6",
                      borderRadius: "12px",
                      margin: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        lineHeight: "1.6",
                        color: "#1e40af",
                        maxWidth: "600px",
                        marginBottom: "16px",
                        textDecoration: "none",
                      }}
                    >
                      Toto je tréningová simulácia. Rozhovor prebieha s umelou
                      inteligenciou na účely vzdelávania a zlepšovania vašich
                      zručností. Všetky údaje sú fiktívne a slúžia len na
                      vzdelávacie účely.
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#2563eb",
                        fontWeight: "500",
                        textDecoration: "none",
                      }}
                    >
                      Pre začatie simulácie začnite komunikovať s volajúcim.
                    </div>
                  </div>
                ) : (
                  dialogue.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}-${msg.timestamp}`}
                      className={`scenarios-msg ${
                        msg.role === "operator" || msg.role === "user"
                          ? "scenarios-msg-operator"
                          : "scenarios-msg-caller"
                      }`}
                    >
                      {msg.message === "..." ? (
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        msg.message
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Read-only status area */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "white",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    color:
                      connectionStatus === "connected"
                        ? "#16a34a"
                        : connectionStatus === "connecting"
                          ? "#ca8a04"
                          : "#dc2626",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "10px",
                      height: "10px",
                      backgroundColor:
                        connectionStatus === "connected"
                          ? "#16a34a"
                          : connectionStatus === "connecting"
                            ? "#ca8a04"
                            : "#dc2626",
                      borderRadius: "50%",
                      animation:
                        connectionStatus === "connected"
                          ? "pulse 1.5s infinite"
                          : "none",
                    }}
                  />
                  {connectionStatus === "connected"
                    ? "Voice Agent Active - Connected"
                    : connectionStatus === "connecting"
                      ? "Waiting for connection..."
                      : "Voice Agent Disconnected"}
                </div>
                <style jsx>{`
                  @keyframes pulse {
                    0% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.5;
                    }
                    100% {
                      opacity: 1;
                    }
                  }
                `}</style>

                <div style={{ display: "flex", gap: "16px" }}>
                  <Button
                    appearance="primary"
                    color="red"
                    onClick={handleEndCall}
                    loading={endSimulation.isPending}
                    disabled={
                      endSimulation.isPending ||
                      !sessionId ||
                      isCallEnded ||
                      dialogue.length === 0
                    }
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      padding: "8px 20px",
                    }}
                  >
                    UKONČIŤ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isResultModalOpen}
        onClose={() => router.push("/operatorBoard/tasks")}
      >
        <Modal.Header>
          <Modal.Title>Výsledok tréningu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {simulationResult && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2
                  style={{
                    color:
                      simulationResult.status === "completed" ? "green" : "red",
                  }}
                >
                  {simulationResult.status === "completed"
                    ? "Úspešný"
                    : "Neúspešný"}
                </h2>
                <h3>Skóre: {simulationResult.score}%</h3>
              </div>

              {simulationResult.evaluation &&
                typeof simulationResult.evaluation === "object" && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "15px",
                      borderRadius: "8px",
                    }}
                  >
                    <h4 style={{ marginBottom: "10px" }}>
                      Detailné hodnotenie:
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {Object.entries(simulationResult.evaluation).map(
                        ([key, value]) =>
                          evaluationLabels[key] ? (
                            <li
                              key={key}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "5px",
                                borderBottom: "1px solid #eee",
                                paddingBottom: "5px",
                              }}
                            >
                              <span>{evaluationLabels[key]}</span>
                              <strong>{value as number}%</strong>
                            </li>
                          ) : null,
                      )}
                    </ul>
                  </div>
                )}

              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  background: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: "5px",
                }}
              >
                <strong>Poznámka:</strong> Toto bol tréningový režim. Dáta
                neboli uložené do databázy.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => router.push("/operatorBoard/tasks")}
            appearance="primary"
          >
            Späť na nástenku
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default function TrainingSessionPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="pageBackground">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
              }}
            >
              <Loader size="lg" content="Načítavam..." />
            </div>
          </div>
        }
      >
        <TrainingSessionPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
