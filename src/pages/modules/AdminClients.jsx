import { TableToolbar, TableSearchField } from "../../components/table/TableToolbar";
import { useEffect, useMemo, useState } from "react";
import Alert from "../../components/Alert"
import ModalCloseButton from "../../components/ui/ModalCloseButton";
import { api, getApiError, resolveFileUrl } from "../../lib/api";
import Pagination from "../../components/table/Pagination";
import TableCrudActions from "../../components/table/TableCrudActions";
import { usePagination } from "../../hooks/usePagination";
import TableLoadingRow from "../../components/table/TableLoadingRow"

const statusClass = (status) => {
  if (status === "verified" || status === "active") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "pending" || status === "resubmitted") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
};

const isVerifiedStatus = (status) =>
  status === "verified" || status === "active";
const isPendingStatus = (status) =>
  status === "pending" || status === "resubmitted";
const isRejectedStatus = (status) => status === "rejected";

const filterOptions = [
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
];

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([
    "pending",
    "verified",
    "rejected",
  ]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);


  // Overall client verification counts come from the dedicated summary API,
  // never from the currently loaded and filtered page of client registrations.
  const [totals, setTotals] = useState({ verified: 0, pending: 0, rejected: 0 });
  const [totalsLoading, setTotalsLoading] = useState(true);
  const loadClientStats = async () => {
    try {
      const { data } = await api.get("/admin/client-registrations/stats");
      setTotals(data.stats || { verified: 0, pending: 0, rejected: 0 });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setTotalsLoading(false);
    }
  };
  useEffect(() => { loadClientStats(); }, []);

  const filteredClients = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !keyword ||
        [
          client.companyName,
          client.companyAddress,
          client.companyType,
          client.companyTypeOther,
          client.name,
          client.representativePosition,
          client.email,
          client.phoneNumber,
          client.status,
          client.rejectionReason,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesFilter =
        (selectedFilters.includes("pending") &&
          isPendingStatus(client.status)) ||
        (selectedFilters.includes("verified") &&
          isVerifiedStatus(client.status)) ||
        (selectedFilters.includes("rejected") &&
          isRejectedStatus(client.status));

      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, selectedFilters]);

  const clientPagination = usePagination(filteredClients, 10);

  const loadClients = async () => {
    try {
      setListLoading(true);
      const { data } = await api.get("/admin/client-registrations");
      setClients(data.users || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const toggleFilter = (value) => {
    setSelectedFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const verifyClient = async (id) => {
    setError("");
    setMessage("");

    try {
      const { data } = await api.patch(`/admin/clients/${id}/approve`);
      setMessage(data.message);
      setSelectedClient(null);
      await Promise.all([loadClients(), loadClientStats()]);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const rejectClient = async (id) => {
    setError("");
    setMessage("");

    const reason = rejectReasons[id] || "";

    if (!reason.trim()) {
      setError("Please add a rejection reason before rejecting the client.");
      return;
    }

    try {
      const { data } = await api.patch(`/admin/clients/${id}/reject`, {
        reason,
      });
      setMessage(data.message);
      setRejectReasons((prev) => ({ ...prev, [id]: "" }));
      setSelectedClient(null);
      await Promise.all([loadClients(), loadClientStats()]);
    } catch (err) {
      setError(getApiError(err));
    }
  };


  const openClientDetails = (client) => {
    setSelectedClient(client);
    setIsEditingClient(false);
    setClientForm({
      name: client.name || "",
      email: client.email || "",
      status: client.status || "pending",
      companyName: client.companyName || "",
      companyAddress: client.companyAddress || "",
      companyType: client.companyType || "",
      companyTypeOther: client.companyTypeOther || "",
      phoneNumber: client.phoneNumber || "",
      representativeFirstName: client.representativeFirstName || "",
      representativeMiddleName: client.representativeMiddleName || "",
      representativeLastName: client.representativeLastName || "",
      representativePosition: client.representativePosition || "",
    });
  };

  const openClientEdit = (client) => {
    openClientDetails(client);
    setIsEditingClient(true);
  };

  const saveClient = async () => {
    if (!selectedClient || !clientForm) return;
    setActionLoading(true);
    setError("");
    try {
      const { data } = await api.patch(`/admin/clients/${selectedClient.id}`, clientForm);
      setSelectedClient(data.user);
      setClientForm((current) => ({ ...current, ...data.user }));
      setIsEditingClient(false);
      setMessage(data.message || "Client updated successfully.");
      await Promise.all([loadClients(), loadClientStats()]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteClient = async (clientOverride = selectedClient) => {
    const clientToDelete = clientOverride;
    if (!clientToDelete || !window.confirm(`Delete ${clientToDelete.companyName || clientToDelete.name}? This action cannot be undone.`)) return;
    setActionLoading(true);
    setError("");
    try {
      const { data } = await api.delete(`/admin/clients/${clientToDelete.id}`);
      if (selectedClient?.id === clientToDelete.id) {
        setSelectedClient(null);
        setClientForm(null);
      }
      setMessage(data.message || "Client deleted successfully.");
      await Promise.all([loadClients(), loadClientStats()]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 otli-module-frame">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between otli-module-hero">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-emerald-700">
              Account Flow
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Client Verification
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              After email OTP registration, client accounts stay pending
              verification until admin reviews the company information and
              uploaded documents.
            </p>
          </div>
        </div>

        <div className="otli-kpi-grid mt-5 grid gap-4 md:grid-cols-3 otli-module-kpis">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="text-xs font-black uppercase tracking-wide text-blue-600">
              Total Verified
            </div>
            <div className="mt-2 text-3xl font-black text-blue-700">
              {totalsLoading ? "…" : totals.verified}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-wide text-amber-600">
              Total Pending
            </div>
            <div className="mt-2 text-3xl font-black text-amber-700">
              {totalsLoading ? "…" : totals.pending}
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <div className="text-xs font-black uppercase tracking-wide text-red-600">
              Total Rejected
            </div>
            <div className="mt-2 text-3xl font-black text-red-700">
              {totalsLoading ? "…" : totals.rejected}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Alert type="success">{message}</Alert>
          <Alert type="error">{error}</Alert>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              Client Registrations
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Search and filter client accounts before opening the account
              details.
            </p>
          </div>

          <TableToolbar withTabs>
            <TableSearchField
 type="text"
 placeholder="Search company, email, name..."
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 ariaLabel="Search records"
 />

            <div role="group" aria-label="Filter client registrations by status" className="otli-table-toolbar-tabs">
              <button type="button" className="otli-table-toolbar-tab"
                aria-pressed={selectedFilters.length === filterOptions.length}
                onClick={() => setSelectedFilters(filterOptions.map((option) => option.value))}>All</button>
              {filterOptions.map((option) => (
                <button key={option.value} type="button" className="otli-table-toolbar-tab"
                  aria-pressed={selectedFilters.includes(option.value)}
                  onClick={() => toggleFilter(option.value)}>{option.label}</button>
              ))}
            </div>
          </TableToolbar>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
          Showing {filteredClients.length} of {clients.length} client
          registrations
        </div>

        <div className="overflow-x-auto">
          <table className="otli-data-table w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Representative</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {listLoading && clients.length === 0 && <TableLoadingRow colSpan={6} rows={6} actionColumn label="Loading client registrations" />}
              {clientPagination.paginatedItems.map((client) => (
                <tr key={client.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    <div className="font-black text-slate-950">
                      {client.companyName}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {client.companyAddress}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {client.companyType}
                      {client.companyTypeOther
                        ? `, ${client.companyTypeOther}`
                        : ""}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-700">
                      {client.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {client.representativePosition}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-600">
                      {client.email}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {client.phoneNumber}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[240px] flex-wrap gap-2">
                      {(client.documents || []).length > 0 ? (
                        client.documents.map((doc) => (
                          <a
                            key={doc.publicId}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                            href={resolveFileUrl(doc.secureUrl || doc.url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {doc.label}
                          </a>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          No documents
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusClass(
                        client.status,
                      )}`}
                    >
                      {client.status}
                    </span>

                    {client.rejectionReason && (
                      <div className="mt-2 max-w-[220px] text-xs font-semibold leading-5 text-red-600">
                        Reason: {client.rejectionReason}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <TableCrudActions
                      recordLabel={client.companyName || client.name || client.email || "client"}
                      onView={() => openClientDetails(client)}
                      onEdit={() => openClientEdit(client)}
                      onDelete={() => deleteClient(client)}
                      deleting={actionLoading && selectedClient?.id === client.id}
                    />
                  </td>
                </tr>
              ))}

              {!listLoading && filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center font-bold text-slate-500"
                  >
                    No client registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination {...clientPagination} />
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  Account Review
                </div>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  {selectedClient.companyName}
                </h3>
                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusClass(
                      selectedClient.status,
                    )}`}
                  >
                    {selectedClient.status}
                  </span>
                </div>
              </div>

              <ModalCloseButton onClick={() => setSelectedClient(null)} label="Close client details" />
            </div>

            {isEditingClient && clientForm && (
              <div className="border-b border-slate-200 bg-blue-50/50 p-5">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Company Name", "companyName"], ["Company Address", "companyAddress"], ["Company Type", "companyType"],
                    ["Other Company Type", "companyTypeOther"], ["Representative First Name", "representativeFirstName"],
                    ["Representative Middle Name", "representativeMiddleName"], ["Representative Last Name", "representativeLastName"],
                    ["Representative Position", "representativePosition"], ["Phone Number", "phoneNumber"], ["Email", "email"],
                  ].map(([label, field]) => (
                    <label key={field} className={field === "companyAddress" ? "lg:col-span-2" : ""}>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
                      <input className="input bg-white" type={field === "email" ? "email" : "text"} value={clientForm[field] || ""} onChange={(event) => setClientForm((current) => ({ ...current, [field]: event.target.value, ...(field === "representativeFirstName" || field === "representativeMiddleName" || field === "representativeLastName" ? { name: [field === "representativeFirstName" ? event.target.value : current.representativeFirstName, field === "representativeMiddleName" ? event.target.value : current.representativeMiddleName, field === "representativeLastName" ? event.target.value : current.representativeLastName].filter(Boolean).join(" ") } : {}) }))} />
                    </label>
                  ))}
                  <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Status</span><select className="input bg-white" value={clientForm.status || "pending"} onChange={(event) => setClientForm((current) => ({ ...current, status: event.target.value }))}><option value="pending">Pending</option><option value="resubmitted">Resubmitted</option><option value="verified">Verified</option><option value="active">Active</option><option value="rejected">Rejected</option></select></label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setIsEditingClient(false)} disabled={actionLoading}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={saveClient} disabled={actionLoading}>{actionLoading ? "Saving..." : "Save Client Changes"}</button>
                </div>
              </div>
            )}

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Company Information
                </h4>

                <div className="mt-4 space-y-3">
                  <Detail
                    label="Company Name"
                    value={selectedClient.companyName}
                  />
                  <Detail
                    label="Company Address"
                    value={selectedClient.companyAddress}
                  />
                  <Detail
                    label="Company Type"
                    value={`${selectedClient.companyType || ""}${
                      selectedClient.companyTypeOther
                        ? `, ${selectedClient.companyTypeOther}`
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Representative Information
                </h4>

                <div className="mt-4 space-y-3">
                  <Detail
                    label="Representative Name"
                    value={selectedClient.name}
                  />
                  <Detail
                    label="Position"
                    value={selectedClient.representativePosition}
                  />
                  <Detail label="Email" value={selectedClient.email} />
                  <Detail
                    label="Phone Number"
                    value={selectedClient.phoneNumber}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                      Legal Consent Record
                    </h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      Registration consent is recorded by the backend and cannot be replaced by the admin review action.
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${selectedClient.legalConsent?.termsAccepted && selectedClient.legalConsent?.privacyAccepted && selectedClient.legalConsent?.representativeAuthorityConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {selectedClient.legalConsent?.termsAccepted && selectedClient.legalConsent?.privacyAccepted && selectedClient.legalConsent?.representativeAuthorityConfirmed ? "Complete" : "Legacy / Incomplete"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail label="Terms Accepted" value={selectedClient.legalConsent?.termsAccepted ? "Yes" : "No"} />
                  <Detail label="Privacy Accepted" value={selectedClient.legalConsent?.privacyAccepted ? "Yes" : "No"} />
                  <Detail label="Authority Confirmed" value={selectedClient.legalConsent?.representativeAuthorityConfirmed ? "Yes" : "No"} />
                  <Detail
                    label="Accepted At"
                    value={selectedClient.legalConsent?.acceptedAt ? new Date(selectedClient.legalConsent.acceptedAt).toLocaleString() : "N/A"}
                  />
                  <Detail label="Terms Version" value={selectedClient.legalConsent?.termsVersion} />
                  <Detail label="Privacy Version" value={selectedClient.legalConsent?.privacyPolicyVersion} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Uploaded Documents
                </h4>

                <div className="mt-4 flex flex-wrap gap-3">
                  {(selectedClient.documents || []).length > 0 ? (
                    selectedClient.documents.map((doc) => (
                      <a
                        key={doc.publicId}
                        href={resolveFileUrl(doc.secureUrl || doc.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        View {doc.label}
                      </a>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                      No documents uploaded.
                    </div>
                  )}
                </div>
              </div>

              {selectedClient.rejectionReason && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 lg:col-span-2">
                  <h4 className="text-sm font-black uppercase tracking-wide text-red-600">
                    Previous Rejection Reason
                  </h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-red-700">
                    {selectedClient.rejectionReason}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Admin Decision
                </h4>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                  <textarea
                    className="input min-h-[110px] !rounded-2xl !p-4 text-sm"
                    placeholder="Add rejection reason here before rejecting the account"
                    value={rejectReasons[selectedClient.id] || ""}
                    onChange={(event) =>
                      setRejectReasons((prev) => ({
                        ...prev,
                        [selectedClient.id]: event.target.value,
                      }))
                    }
                    disabled={isVerifiedStatus(selectedClient.status)}
                  />

                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isVerifiedStatus(selectedClient.status)}
                      onClick={() => verifyClient(selectedClient.id)}
                    >
                      Verify Account
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isVerifiedStatus(selectedClient.status)}
                      onClick={() => rejectClient(selectedClient.id)}
                    >
                      Reject Account
                    </button>
                  </div>
                </div>

                {isVerifiedStatus(selectedClient.status) && (
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    This account is already verified or active. Decision actions
                    are disabled.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }) => {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-800">
        {value || "N/A"}
      </div>
    </div>
  );
};

export default AdminClients;
