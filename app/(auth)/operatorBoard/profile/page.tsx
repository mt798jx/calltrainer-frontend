"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Message, useToaster } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { useTasksDashboard } from "@/hooks/useTasks";
import { useUpdateUser } from "@/hooks/useUsers";
import { usersApi } from "@/lib/api";
import type { UserResponse } from "@/types/api";
import Footer from "../../components/Footer";

export default function ProfilePage() {
  const _router = useRouter();
  const { data: user } = useMe();
  const { data: tasksData } = useTasksDashboard(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const kosOptions = [
    "KRAJSKÉ OPERAČNÉ STREDISKO BRATISLAVA",
    "KRAJSKÉ OPERAČNÉ STREDISKO TRNAVA",
    "KRAJSKÉ OPERAČNÉ STREDISKO NITRA",
    "KRAJSKÉ OPERAČNÉ STREDISKO TRENČÍN",
    "KRAJSKÉ OPERAČNÉ STREDISKO BANSKÁ BYSTRICA",
    "KRAJSKÉ OPERAČNÉ STREDISKO ŽILINA",
    "KRAJSKÉ OPERAČNÉ STREDISKO PREŠOV",
    "KRAJSKÉ OPERAČNÉ STREDISKO KOŠICE",
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        organization: user.organization || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Get real stats from API
  const completedTasksCount = tasksData?.stats?.completed || 0;
  const successRate = tasksData?.stats?.successRate || "0%";
  const toaster = useToaster();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("sk-SK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_e) {
      return "";
    }
  };

  return (
    <>
      <div className="pageBackground">
        <DashboardHeader
          userName={user ? `${user.first_name} ${user.last_name}` : ""}
          userRole="Operátor"
        />

        {/* Content */}
        <div className="dashboard-content">
          <div className="profile-title-bar">
            <h2 className="profile-title">Môj profil</h2>
            <Button
              appearance="ghost"
              onClick={() => setIsEditing(!isEditing)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Upraviť
            </Button>
          </div>

          {/* Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-avatar" style={{ position: "relative" }}>
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt="Profile"
                  width={120}
                  height={120}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                  unoptimized
                />
              ) : (
                <>
                  {user?.first_name?.charAt(0)}
                  {user?.last_name?.charAt(0)}
                </>
              )}
              <input
                type="file"
                id="profile-picture-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  // Validate file size (max 2MB)
                  if (file.size > 2 * 1024 * 1024) {
                    toaster.push(
                      <Message type="error">
                        Obrázok je príliš veľký. Maximálna veľkosť je 2MB.
                      </Message>,
                    );
                    return;
                  }

                  // Convert to base64
                  const reader = new FileReader();
                  reader.onload = async () => {
                    try {
                      setUploadingPicture(true);
                      const base64 = reader.result as string;
                      const updatedUser = await usersApi.uploadProfilePicture(
                        user.id,
                        base64,
                      );
                      queryClient.setQueryData(["auth-me"], updatedUser);
                      toaster.push(
                        <Message type="success">
                          Profilová fotka nastavená
                        </Message>,
                      );
                    } catch (_err) {
                      toaster.push(
                        <Message type="error">
                          Nepodarilo sa nahrať fotku
                        </Message>,
                      );
                    } finally {
                      setUploadingPicture(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() =>
                  document.getElementById("profile-picture-upload")?.click()
                }
                disabled={uploadingPicture}
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  border: "3px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: uploadingPicture ? "not-allowed" : "pointer",
                  opacity: uploadingPicture ? 0.6 : 1,
                }}
                title="Zmeniť profilovú fotku"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  role="img"
                  aria-label="Ikona fotoaparátu"
                >
                  <title>Zmeniť profilovú fotku</title>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-badges">
                <span className="profile-badge profile-badge-operator">
                  Operátor
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <h4 className="profile-stat-label">Dátum registrácie</h4>
              <p className="profile-stat-value">
                {formatDate(user?.created_at)}
              </p>
            </div>

            <div className="profile-stat-card">
              <h4 className="profile-stat-label">Dokončené úlohy</h4>
              <p className="profile-stat-value">{completedTasksCount}</p>
            </div>

            <div className="profile-stat-card">
              <h4 className="profile-stat-label">Úspešnosť</h4>
              <p className="profile-stat-value">{successRate}</p>
            </div>
          </div>

          {/* Osobné údaje */}
          <div className="profile-section">
            <h3 className="profile-section-title">Osobné údaje</h3>

            <div className="profile-data-grid">
              <div className="profile-data-field">
                <span className="profile-data-label">Meno a priezvisko</span>
                <div className="profile-data-value">
                  {user?.first_name} {user?.last_name}
                </div>
              </div>

              <div className="profile-data-field">
                <span className="profile-data-label">Email</span>
                <div className="profile-data-value">{user?.email}</div>
              </div>

              <div className="profile-data-field">
                <span className="profile-data-label">Organizácia</span>
                <div className="profile-data-value">
                  {user?.organization || "Neuvedené"}
                </div>
              </div>

              <div className="profile-data-field">
                <span className="profile-data-label">Telefón</span>
                <div className="profile-data-value">{user?.phone || ""}</div>
              </div>
            </div>
          </div>

          {/* Zabezpečenie */}
          <div className="profile-section">
            <h3 className="profile-section-title">Zabezpečenie</h3>

            <div className="profile-security-item">
              <div className="profile-security-info">
                <h4>Heslo</h4>
                <p>Naposledy zmenené pred {""}</p>
              </div>
              <Button
                appearance="ghost"
                onClick={() => setIsChangingPassword(true)}
              >
                Zmeniť heslo
              </Button>
            </div>

            <div className="profile-security-item">
              <div className="profile-security-info">
                <h4>Dvojfaktorová autentifikácia</h4>
                <p>Dodatočná ochrana vášho účtu</p>
              </div>
              <Button
                appearance="ghost"
                onClick={async () => {
                  if (!user) return;
                  try {
                    const enable = !user.require_2fa;
                    await usersApi.toggle2fa(user.id, { enable });
                    queryClient.invalidateQueries({ queryKey: ["auth-me"] });
                    toaster.push(
                      <Message type="success">
                        Nastavenie 2FA aktualizované
                      </Message>,
                    );
                  } catch (err: unknown) {
                    const errorMsg =
                      err instanceof Error
                        ? err.message
                        : "Nepodarilo sa aktualizovať 2FA";

                    // Check if it's the specific error about admin not enabling 2FA
                    if (errorMsg.includes("Cannot enable require_2fa")) {
                      toaster.push(
                        <Message type="error">
                          V systéme nie je povolená 2FA verifikácia. Prosím,
                          kontaktujte administrátora.
                        </Message>,
                      );
                    } else {
                      toaster.push(<Message type="error">{errorMsg}</Message>);
                    }
                  }
                }}
              >
                {user?.require_2fa ? "Vypnúť 2FA" : "Zapnúť 2FA"}
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div
            className="profile-modal-overlay"
            onClick={() => setIsEditing(false)}
            role="dialog"
            aria-modal="true"
            onKeyDown={(e) => e.key === "Escape" && setIsEditing(false)}
            tabIndex={-1}
          >
            <div
              className="profile-modal"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Escape" && setIsEditing(false)}
              role="document"
            >
              <div className="profile-modal-header">
                <h2>Upraviť profil</h2>
                <button
                  type="button"
                  className="profile-modal-close"
                  onClick={() => setIsEditing(false)}
                >
                  ✕
                </button>
              </div>

              <div className="profile-modal-content">
                {/* Personal Info */}
                <div className="profile-modal-section">
                  <h3 className="profile-modal-section-title">Osobné údaje</h3>

                  <div className="profile-modal-grid">
                    <div className="profile-modal-form-group">
                      <label
                        className="profile-modal-label"
                        htmlFor="modal-firstName"
                      >
                        Meno
                      </label>
                      <input
                        id="modal-firstName"
                        type="text"
                        placeholder="Meno"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="profile-modal-form-group">
                      <label
                        className="profile-modal-label"
                        htmlFor="modal-lastName"
                      >
                        Priezvisko
                      </label>
                      <input
                        id="modal-lastName"
                        type="text"
                        placeholder="Priezvisko"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>

                    <div className="profile-modal-form-group">
                      <label
                        className="profile-modal-label"
                        htmlFor="modal-email"
                      >
                        Email
                      </label>
                      <input
                        id="modal-email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Info */}
                <div className="profile-modal-section">
                  <h3 className="profile-modal-section-title">Organizácia</h3>

                  <div className="profile-modal-grid">
                    <div className="profile-modal-form-group">
                      <label
                        className="profile-modal-label"
                        htmlFor="modal-org"
                      >
                        Organizácia
                      </label>
                      <select
                        id="modal-org"
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            organization: e.target.value,
                          })
                        }
                        className="profile-modal-select"
                      >
                        <option value="">Vyberte KOS</option>
                        {kosOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="profile-modal-form-group">
                      <label
                        className="profile-modal-label"
                        htmlFor="modal-phone"
                      >
                        Telefón
                      </label>
                      <input
                        id="modal-phone"
                        type="text"
                        placeholder="Telefón"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "24px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    appearance="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Zrušiť
                  </Button>
                  <Button
                    appearance="primary"
                    color="red"
                    onClick={async () => {
                      if (!user) return;
                      const data: {
                        first_name: string;
                        last_name: string;
                        email: string;
                        organization: string;
                        phone: string;
                      } = {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        email: formData.email,
                        organization: formData.organization,
                        phone: formData.phone,
                      };
                      try {
                        const res = await updateUser.mutateAsync({
                          userId: user.id,
                          data,
                        });
                        // update auth-me cache so UI updates immediately
                        queryClient.setQueryData(
                          ["auth-me"],
                          (old: UserResponse | undefined) =>
                            ({
                              ...(old || {}),
                              ...res,
                            }) as UserResponse,
                        );
                        // also update local form state to reflect saved values
                        setFormData((f) => ({
                          ...f,
                          phone: data.phone || f.phone,
                        }));
                        toaster.push(<Message type="success">Uložené</Message>);
                        setIsEditing(false);
                      } catch (_err) {
                        toaster.push(
                          <Message type="error">
                            Nepodarilo sa uložiť zmeny
                          </Message>,
                        );
                      }
                    }}
                  >
                    Uložiť zmeny
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {isChangingPassword && (
          <div
            className="profile-modal-overlay"
            onClick={() => setIsChangingPassword(false)}
            role="dialog"
            aria-modal="true"
            onKeyDown={(e) =>
              e.key === "Escape" && setIsChangingPassword(false)
            }
            tabIndex={-1}
          >
            <div
              className="profile-modal"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) =>
                e.key === "Escape" && setIsChangingPassword(false)
              }
              role="document"
            >
              <div className="profile-modal-header">
                <h2>Zmena hesla</h2>
                <button
                  type="button"
                  className="profile-modal-close"
                  onClick={() => setIsChangingPassword(false)}
                >
                  ✕
                </button>
              </div>

              <div className="profile-modal-content">
                <div className="profile-modal-section">
                  <div className="profile-modal-form-group">
                    <label
                      className="profile-modal-label"
                      htmlFor="pwd-current"
                    >
                      Aktuálne heslo
                    </label>
                    <input
                      id="pwd-current"
                      type="password"
                      placeholder="Aktuálne heslo"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="profile-modal-form-group">
                    <label className="profile-modal-label" htmlFor="pwd-new">
                      Nové heslo
                    </label>
                    <input
                      id="pwd-new"
                      type="password"
                      placeholder="Nové heslo"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="profile-modal-form-group">
                    <label
                      className="profile-modal-label"
                      htmlFor="pwd-confirm"
                    >
                      Potvrdiť heslo
                    </label>
                    <input
                      id="pwd-confirm"
                      type="password"
                      placeholder="Potvrdiť heslo"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "24px",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    appearance="ghost"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Zrušiť
                  </Button>
                  <Button
                    appearance="primary"
                    color="red"
                    onClick={async () => {
                      if (!user) return;
                      if (
                        passwordData.newPassword !==
                        passwordData.confirmPassword
                      ) {
                        toaster.push(
                          <Message type="error">Heslá sa nezhodujú</Message>,
                        );
                        return;
                      }
                      if (!passwordData.newPassword) {
                        toaster.push(
                          <Message type="error">
                            Nové heslo nemôže byť prázdne
                          </Message>,
                        );
                        return;
                      }
                      try {
                        await usersApi.changePassword(user.id, {
                          current_password: passwordData.currentPassword,
                          new_password: passwordData.newPassword,
                        });
                        toaster.push(
                          <Message type="success">Heslo zmenené</Message>,
                        );
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        setIsChangingPassword(false);
                      } catch (err: unknown) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "Nepodarilo sa zmeniť heslo";
                        toaster.push(<Message type="error">{msg}</Message>);
                      }
                    }}
                  >
                    Uložiť zmeny
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
