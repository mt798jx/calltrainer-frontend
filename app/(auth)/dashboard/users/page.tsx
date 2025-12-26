"use client";

import EditIcon from "@rsuite/icons/Edit";
import PlusIcon from "@rsuite/icons/Plus";
import SearchIcon from "@rsuite/icons/Search";
import TrashIcon from "@rsuite/icons/Trash";
import { useMemo, useState } from "react";
import {
  Button,
  Input,
  InputGroup,
  Message,
  Modal,
  SelectPicker,
  useToaster,
} from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/hooks/useUsers";
import type { UserResponse } from "@/types";
import Footer from "../../components/Footer";

export default function UsersManagementPage() {
  const toaster = useToaster();
  const { data: users } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const displayUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.map((u) => ({
      ...u,
      calls_count: u.calls_count ?? 0,
      score: u.score ?? null,
    }));
  }, [users]);

  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "OPERATOR" | "ADMIN">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [organizationFilter, setOrganizationFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    | "none"
    | "name-asc"
    | "name-desc"
    | "score-asc"
    | "score-desc"
    | "calls-asc"
    | "calls-desc"
  >("none");
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    organization: "",
    role: "OPERATOR" as "OPERATOR" | "ADMIN",
    password: "",
  });

  const [nameInput, setNameInput] = useState("");

  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    organization: "",
    role: "OPERATOR" as "OPERATOR" | "ADMIN",
    is_active: true,
  });

  const [editNameInput, setEditNameInput] = useState("");

  const filteredUsers = useMemo(() => {
    if (!displayUsers) return [];

    const filtered = displayUsers.filter((user) => {
      const query = searchValue.toLowerCase();
      const matchesText =
        !query ||
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.organization?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.is_active) ||
        (statusFilter === "INACTIVE" && !user.is_active);

      const matchesOrganization =
        organizationFilter === "ALL" ||
        user.organization === organizationFilter;

      return matchesText && matchesRole && matchesStatus && matchesOrganization;
    });

    if (sortBy === "name-asc") {
      return [...filtered].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    if (sortBy === "name-desc") {
      return [...filtered].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }

    if (sortBy === "score-desc") {
      return [...filtered].sort((a, b) => {
        const scoreA = a.score ?? -1;
        const scoreB = b.score ?? -1;
        return scoreB - scoreA;
      });
    }

    if (sortBy === "score-asc") {
      return [...filtered].sort((a, b) => {
        const scoreA = a.score ?? -1;
        const scoreB = b.score ?? -1;
        return scoreA - scoreB;
      });
    }

    if (sortBy === "calls-desc") {
      return [...filtered].sort((a, b) => b.calls_count - a.calls_count);
    }

    if (sortBy === "calls-asc") {
      return [...filtered].sort((a, b) => a.calls_count - b.calls_count);
    }

    return filtered;
  }, [
    displayUsers,
    searchValue,
    roleFilter,
    statusFilter,
    organizationFilter,
    sortBy,
  ]);

  const stats = useMemo(() => {
    if (!displayUsers)
      return { total: 0, active: 0, inactive: 0, operators: 0, admins: 0 };

    return {
      total: displayUsers.length,
      active: displayUsers.filter((u) => u.is_active).length,
      inactive: displayUsers.filter((u) => !u.is_active).length,
      operators: displayUsers.filter((u) => u.role === "OPERATOR").length,
      admins: displayUsers.filter((u) => u.role === "ADMIN").length,
    };
  }, [displayUsers]);

  const handleOpenCreate = () => {
    setCreateFormData({
      first_name: "",
      last_name: "",
      email: "",
      organization: "",
      role: "OPERATOR",
      password: "",
    });
    setNameInput("");
    setCreateModal(true);
  };

  const handleOpenEdit = (user: UserResponse) => {
    setSelectedUser(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      organization: user.organization || "",
      role: user.role,
      is_active: user.is_active,
    });
    setEditNameInput(`${user.first_name} ${user.last_name}`.trim());
    setEditModal(true);
  };

  const handleOpenDelete = (user: UserResponse) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Split name input into first and last name before submitting
    const nameParts = editNameInput.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    console.log("Updating user:", selectedUser.id, {
      first_name: firstName,
      last_name: lastName,
      email: editFormData.email,
      organization: editFormData.organization,
      role: editFormData.role,
      is_active: editFormData.is_active,
    });

    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        data: {
          first_name: firstName,
          last_name: lastName,
          email: editFormData.email,
          organization: editFormData.organization,
          role: editFormData.role,
          is_active: editFormData.is_active,
        },
      });
      toaster.push(
        <Message showIcon type="success">
          Používateľ bol aktualizovaný
        </Message>,
        { placement: "topEnd" },
      );
      setEditModal(false);
      setSelectedUser(null);
    } catch (_error) {
      toaster.push(
        <Message showIcon type="error">
          Nastala chyba pri aktualizácii používateľa
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toaster.push(
        <Message showIcon type="success">
          Používateľ bol odstránený
        </Message>,
        { placement: "topEnd" },
      );
      setDeleteModal(false);
      setSelectedUser(null);
    } catch (_error) {
      toaster.push(
        <Message showIcon type="error">
          Nastala chyba pri odstraňovaní používateľa
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const handleCreateUser = async () => {
    // Split name input into first and last name before submitting
    const nameParts = nameInput.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await createUser.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: createFormData.email,
        organization: createFormData.organization,
        role: createFormData.role,
        password: createFormData.password,
      });
      toaster.push(
        <Message showIcon type="success">
          Používateľ bol vytvorený
        </Message>,
        { placement: "topEnd" },
      );
      setCreateModal(false);
      setCreateFormData({
        first_name: "",
        last_name: "",
        email: "",
        organization: "",
        role: "OPERATOR",
        password: "",
      });
      setNameInput("");
    } catch (_error) {
      toaster.push(
        <Message showIcon type="error">
          Nastala chyba pri vytváraní používateľa
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const roleOptions = [
    { label: "Operátor", value: "OPERATOR" },
    { label: "Administrátor", value: "ADMIN" },
  ];

  const kosOptions = useMemo(
    () => [
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
    ],
    [],
  );

  const roleFilterOptions = [
    { label: "Všetky roly", value: "ALL" },
    ...roleOptions,
  ];

  const statusOptions = [
    { label: "Aktívny", value: true },
    { label: "Neaktívny", value: false },
  ];

  const statusFilterOptions = [
    { label: "Všetky statusy", value: "ALL" },
    { label: "Aktívni", value: "ACTIVE" },
    { label: "Neaktívni", value: "INACTIVE" },
  ];

  const organizationFilterOptions = useMemo(() => {
    return [{ label: "Všetky organizácie", value: "ALL" }, ...kosOptions];
  }, [kosOptions]);

  const sortOptions = [
    { label: "Bez zoradenia", value: "none" },
    { label: "Meno (A-Z)", value: "name-asc" },
    { label: "Meno (Z-A)", value: "name-desc" },
    { label: "Skóre (↓)", value: "score-desc" },
    { label: "Skóre (↑)", value: "score-asc" },
    { label: "Hovory (↓)", value: "calls-desc" },
    { label: "Hovory (↑)", value: "calls-asc" },
  ];

  return (
    <div className="pageBackground">
      {/* Header */}
      <DashboardHeader userName="Admin" userRole="Admin" />

      {/* Content */}
      <div className="users-content">
        <div className="users-title-bar">
          <h2 className="users-page-title">Správa používateľov</h2>
          <Button
            appearance="primary"
            color="red"
            startIcon={<PlusIcon />}
            onClick={handleOpenCreate}
          >
            Pridať používateľa
          </Button>
        </div>

        {/* Stats */}
        <div className="scenarios-stats-grid">
          <button
            type="button"
            className="scenarios-stat-card is-total"
            onClick={() => {
              setRoleFilter("ALL");
              setStatusFilter("ALL");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }
            }}
          >
            <h3 className="scenarios-stat-label">Celkovo používateľov</h3>
            <p className="scenarios-stat-value">{stats.total}</p>
          </button>

          <button
            type="button"
            className="scenarios-stat-card is-status"
            onClick={() => {
              setRoleFilter("ALL");
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
                setRoleFilter("ALL");
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
            <h3 className="scenarios-stat-label">Aktívni / Neaktívni</h3>
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
            className="scenarios-stat-card is-roles"
            onClick={() => {
              setStatusFilter("ALL");
              if (roleFilter === "ALL") {
                setRoleFilter("OPERATOR");
              } else if (roleFilter === "OPERATOR") {
                setRoleFilter("ADMIN");
              } else {
                setRoleFilter("ALL");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setStatusFilter("ALL");
                if (roleFilter === "ALL") {
                  setRoleFilter("OPERATOR");
                } else if (roleFilter === "OPERATOR") {
                  setRoleFilter("ADMIN");
                } else {
                  setRoleFilter("ALL");
                }
              }
            }}
          >
            <h3 className="scenarios-stat-label">Operátori / Admini</h3>
            <div className="scenarios-stat-dual">
              <p className="scenarios-stat-value" style={{ color: "#3b82f6" }}>
                {stats.operators}
              </p>
              <span className="scenarios-stat-divider">/</span>
              <p
                className="scenarios-stat-subvalue"
                style={{ color: "#8b5cf6" }}
              >
                {stats.admins}
              </p>
            </div>
          </button>
        </div>

        {/* Table */}
        <div className="users-table-container">
          <div
            className="users-table-search"
            style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
          >
            <div style={{ flex: "1 1 260px" }}>
              <InputGroup inside style={{ width: "100%" }}>
                <Input
                  placeholder="Hľadať používateľa..."
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
              data={sortOptions}
              value={sortBy}
              onChange={(value) =>
                setSortBy(
                  value as
                    | "none"
                    | "name-asc"
                    | "name-desc"
                    | "score-asc"
                    | "score-desc"
                    | "calls-asc"
                    | "calls-desc",
                )
              }
              searchable={false}
              cleanable={false}
              style={{ minWidth: 180 }}
              placeholder="Zoradiť podľa"
            />
            <SelectPicker
              data={organizationFilterOptions}
              value={organizationFilter}
              onChange={(value) => setOrganizationFilter(value || "ALL")}
              searchable={false}
              cleanable={false}
              style={{ minWidth: 180 }}
              placeholder="Filtrovať organizáciu"
            />
            <SelectPicker
              data={roleFilterOptions}
              value={roleFilter}
              onChange={(value) =>
                setRoleFilter(value as "ALL" | "OPERATOR" | "ADMIN")
              }
              searchable={false}
              cleanable={false}
              style={{ minWidth: 160 }}
              placeholder="Filtrovať rolu"
            />
            <SelectPicker
              data={statusFilterOptions}
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              searchable={false}
              cleanable={false}
              style={{ minWidth: 160 }}
              placeholder="Filtrovať status"
            />
          </div>

          {/* Table Header */}
          <div className="users-table-header">
            <div>Meno</div>
            <div>Email</div>
            <div>Organizácia</div>
            <div>Rola</div>
            <div>Status</div>
            <div>Hovory</div>
            <div>Skóre</div>
            <div className="users-table-header-actions">Akcie</div>
          </div>

          {/* Table Body */}
          {filteredUsers.length === 0 ? (
            <div className="users-table-empty">
              <p>Žiadni používatelia</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="users-table-row">
                <div className="users-table-cell-name">
                  {user.first_name} {user.last_name}
                </div>
                <div className="users-table-cell-email">{user.email}</div>
                <div className="users-table-cell-org">
                  {user.organization || "-"}
                </div>
                <div>
                  <span
                    className={`users-role-badge ${user.role === "ADMIN" ? "users-role-badge-admin" : "users-role-badge-operator"}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      role="img"
                      aria-label="Používateľ ikona"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {user.role === "ADMIN" ? "Admin" : "Operátor"}
                  </span>
                </div>
                <div>
                  <span
                    className={`users-status-badge ${user.is_active ? "users-status-badge-active" : "users-status-badge-inactive"}`}
                  >
                    {user.is_active ? "Aktívny" : "Neaktívny"}
                  </span>
                </div>
                <div className="users-table-cell-calls">
                  {user.role === "OPERATOR" ? user.calls_count : 0}
                </div>
                <div
                  className={`users-table-cell-score ${user.role === "OPERATOR" ? "users-table-cell-score-operator" : ""}`}
                >
                  {user.role === "OPERATOR"
                    ? user.score != null
                      ? `${Math.round(user.score)}%`
                      : "-"
                    : "-"}
                </div>
                <div className="users-table-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="users-action-btn users-action-btn-edit"
                  >
                    <EditIcon style={{ fontSize: "16px", color: "#666" }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(user)}
                    className="users-action-btn users-action-btn-delete"
                  >
                    <TrashIcon style={{ fontSize: "16px", color: "#d32f2f" }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Pridať nového používateľa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="users-modal-form">
            <div>
              <label htmlFor="create-name" className="users-form-label">
                Meno a priezvisko
              </label>
              <InputGroup>
                <InputGroup.Addon>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    role="img"
                    aria-label="Používateľ ikona"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </InputGroup.Addon>
                <Input
                  id="create-name"
                  placeholder="Ján Novák"
                  value={nameInput}
                  onChange={setNameInput}
                />
              </InputGroup>
            </div>

            <div>
              <label htmlFor="create-email" className="users-form-label">
                Email
              </label>
              <InputGroup>
                <InputGroup.Addon>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    role="img"
                    aria-label="Email ikona"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </InputGroup.Addon>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="jan.novak@example.com"
                  value={createFormData.email}
                  onChange={(value) =>
                    setCreateFormData({ ...createFormData, email: value })
                  }
                />
              </InputGroup>
            </div>

            <div>
              <label htmlFor="create-organization" className="users-form-label">
                Organizácia
              </label>
              <SelectPicker
                id="create-organization"
                data={kosOptions}
                placeholder="Vyberte KOS"
                value={createFormData.organization || undefined}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    organization: value || "",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div>
              <label htmlFor="create-role" className="users-form-label">
                Rola
              </label>
              <SelectPicker
                id="create-role"
                data={roleOptions}
                value={createFormData.role}
                onChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    role: value as "OPERATOR" | "ADMIN",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div>
              <label htmlFor="create-password" className="users-form-label">
                Dočasné heslo
              </label>
              <Input
                id="create-password"
                type="password"
                placeholder="••••••••"
                value={createFormData.password}
                onChange={(value) =>
                  setCreateFormData({ ...createFormData, password: value })
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setCreateModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            appearance="primary"
            color="red"
            disabled={
              !nameInput.trim() ||
              !createFormData.email.trim() ||
              !createFormData.password.trim()
            }
            loading={createUser.isPending}
            onClick={handleCreateUser}
          >
            Pridať používateľa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Upraviť používateľa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="users-modal-form">
            <div>
              <label htmlFor="edit-name" className="users-form-label">
                Meno a priezvisko
              </label>
              <Input
                id="edit-name"
                placeholder="Ján Novák"
                value={editNameInput}
                onChange={setEditNameInput}
              />
            </div>

            <div>
              <label htmlFor="edit-email" className="users-form-label">
                Email
              </label>
              <Input
                id="edit-email"
                type="email"
                placeholder="jan.novak@example.com"
                value={editFormData.email}
                onChange={(value) =>
                  setEditFormData({ ...editFormData, email: value })
                }
              />
            </div>

            <div>
              <label htmlFor="edit-organization" className="users-form-label">
                Organizácia
              </label>
              <SelectPicker
                id="edit-organization"
                data={kosOptions}
                placeholder="Vyberte KOS"
                value={editFormData.organization || undefined}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    organization: value || "",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div>
              <label htmlFor="edit-role" className="users-form-label">
                Rola
              </label>
              <SelectPicker
                id="edit-role"
                data={roleOptions}
                value={editFormData.role}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    role: value as "OPERATOR" | "ADMIN",
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="users-form-label">
                Status
              </label>
              <SelectPicker
                id="edit-status"
                data={statusOptions}
                value={editFormData.is_active}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    is_active: value as boolean,
                  })
                }
                block
                searchable={false}
                cleanable={false}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setEditModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            appearance="primary"
            color="red"
            disabled={!editNameInput.trim() || !editFormData.email.trim()}
            loading={updateUser.isPending}
            onClick={handleUpdateUser}
          >
            Uložiť zmeny
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} size="xs">
        <Modal.Header>
          <Modal.Title>Odstrániť používateľa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Naozaj chcete odstrániť používateľa{" "}
            <strong>
              {selectedUser?.first_name} {selectedUser?.last_name}
            </strong>
            ?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setDeleteModal(false)} appearance="subtle">
            Zrušiť
          </Button>
          <Button
            onClick={handleDelete}
            appearance="primary"
            color="red"
            loading={deleteUser.isPending}
          >
            Odstrániť
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </div>
  );
}
