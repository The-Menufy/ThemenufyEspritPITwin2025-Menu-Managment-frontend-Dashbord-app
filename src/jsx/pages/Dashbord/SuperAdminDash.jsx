import { useEffect, useState, useMemo, useCallback } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import swal from "sweetalert";
import * as XLSX from "xlsx";
import { GlobalFilter } from "../../components/table/FilteringTable/GlobalFilter";
import api from "../../../api";
import useAdminStore from "../../store/AdminStore";

export default function DashAdmins() {
  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isEmailVerified: false,
    blocked: false,
    
    
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = () => {
    api.get("/superadmins")
      .then((response) => {
        setAdmins(response.data.data.filter(admin => !admin.archived)); 
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des administrateurs", error);
      });
  };

  // États pour les filtres
  const [globalFilter, setGlobalFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin =>
      admin.email && // Vérifie que admin.email existe
      typeof admin.email === "string" && // Vérifie que c'est bien une chaîne
      admin.email.toLowerCase().includes(globalFilter.toLowerCase()) &&
      admin.email.toLowerCase().includes(emailFilter.toLowerCase())
    );

  }, [admins, globalFilter, emailFilter]);
  
  const NonArchiverd = useMemo(() => {
    return admins
      .filter(admin => !admin.archived) // 🔥 Afficher seulement les SuperAdmins actifs (non archivés)
      .filter(admin =>
        admin.email.toLowerCase().includes(globalFilter.toLowerCase()) &&
        admin.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
  }, [admins, globalFilter, emailFilter]);
  
  const paginatedAdmins = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filteredAdmins.slice(indexOfFirstRow, indexOfLastRow);
  }, [filteredAdmins, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);

  // Gestion des pages
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Exportation en Excel
  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(admins);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SuperAdmins");
    XLSX.writeFile(workbook, "superadmins.xlsx");
  }, [admins]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  


  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (isEditMode) {
      api.put(`/superadmins/${selectedAdmin._id}`, formData)
        .then((response) => {
          setAdmins((prevAdmins) =>
            prevAdmins.map((a) =>
              a._id === selectedAdmin._id ? { ...a, ...formData } : a
            )
          );
          swal("Success", "Super Admin updated successfully", "success");
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour :", error);
          swal("Error", "Failed to update Super Admin", "error");
        });
    } else {
      api.post("/superadmins", formData)
        .then((response) => {
          setAdmins([...admins, response.data]); // Ajoute directement le nouvel admin
          swal("Success", "Super Admin added successfully", "success");
        })
        .catch((error) => {
          console.error("Erreur lors de l'ajout :", error);
          swal("Error", "Failed to add Super Admin", "error");
        });
    }
  
    setShowModal(false);
    setIsEditMode(false);
  };
  

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      password: "",  
      isEmailVerified: admin.isEmailVerified || false,
      blocked: admin.blocked || false,
    });
    setIsEditMode(true);
    setShowModal(true);
  };
  

  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };
  
  const handleDelete = (id) => {
    swal({
      title: "Are you sure?",
      text: "This action is irreversible!",
      icon: "warning",
      buttons: ["Cancel", "Confirm"],
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        api.delete(`/superadmins/${id}`).then(() => {
          fetchAdmins();
          swal("Super Admin deleted successfully", { icon: "success" });
        });
      }
    });
  };
  

  const handleArchiveOrDelete = async (admin) => {
    const updatedAdmin = { ...admin, archived: !admin.archived };
  
    swal({
      title: "Are you sure?",
      text: admin.archived
        ? "This will permanently delete the SuperAdmin!"
        : "This will archive the SuperAdmin.",
      icon: "warning",
      buttons: ["Cancel", admin.archived ? "Delete" : "Archive"],
      dangerMode: true,
    }).then((confirmAction) => {
      if (confirmAction) {
        api.put(`/superadmins/${admin._id}`, updatedAdmin)
          .then(() => {
            setAdmins((prevAdmins) =>
              prevAdmins.map((a) => (a._id === admin._id ? updatedAdmin : a))
            );
  
            swal("Success", `Super Admin ${admin.archived ? "deleted" : "archived"} successfully`, "success");
          })
          .catch((error) => {
            console.error("Error updating admin archived status:", error);
            swal("Error", "Failed to update admin status", "error");
          });
      }
    });
  };
  
  



  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [sortOrder, setSortOrder] = useState("asc");

  const sortAdminsByEmail = () => {
    const sortedAdmins = [...admins].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.email.localeCompare(b.email);
      } else {
        return b.email.localeCompare(a.email);
      }
    });
  
    setAdmins(sortedAdmins);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Alterner le tri
  };
  


  const toggleBlock = (admin) => {
    const updatedAdmin = { ...admin, blocked: !admin.blocked };
  
    api.put(`/superadmins/${admin._id}`, updatedAdmin)
      .then(() => {
        setAdmins((prevAdmins) =>
          prevAdmins.map((a) => (a._id === admin._id ? updatedAdmin : a))
        );
        swal("Success", `Super Admin ${admin.blocked ? "unblocked" : "blocked"} successfully`, "success");
      })
      .catch((error) => {
        console.error("Error updating admin blocked status:", error);
        swal("Error", "Failed to update admin status", "error");
      });
  };
  
  return (
    <>
      <div className="col-12">
        {/* Modal Ajouter / Modifier */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>{isEditMode ? "Edit Super Admin" : "Add Super Admin"}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <form onSubmit={handleSubmit}>
   
      <div className="form-group mb-3">
        <label className="text-black font-w500">Email</label>
        <input
          type="email"
          className="form-control"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group mb-3">
        <label className="text-black font-w500">Password (Leave blank if not changing)</label>
        <input
          type="password"
          className="form-control"
          placeholder="New Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      <div className="form-group mb-3">
        <label className="text-black font-w500">Verified</label>
        <select
          className="form-control"
          name="isEmailVerified"
          value={formData.isEmailVerified}
          onChange={handleChange}
        >
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
      </div>
      <div className="form-group mb-3">
        <label className="text-black font-w500">Blocked</label>
        <select
          className="form-control"
          name="blocked"
          value={formData.blocked}
          onChange={handleChange}
        >
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
      </div>
      <Button variant="primary" type="submit">
        {isEditMode ? "Update" : "Add"}
      </Button>
    </form>
  </Modal.Body>
</Modal>


        {/* Modal Détails */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Super Admin Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedAdmin && (
      <div>
        <p><strong>Email :</strong> {selectedAdmin.email}</p>
        <p><strong>Verified :</strong> {selectedAdmin.isEmailVerified ? "Yes" : "No"}</p>
        <p><strong>Blocked :</strong> {selectedAdmin.blocked ? "Yes" : "No"}</p>
      </div>
    )}
  </Modal.Body>
</Modal>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Super Admin Dashboard</h4>
          <div>
            <Button variant="success" onClick={() => setShowModal(true)}>
              Add Super Admin
            </Button>
            <Button variant="info" className="ms-2" onClick={exportToExcel}>
              <i className="fa fa-file-excel fa-sm me-2"></i> Export To Excel
            </Button>
            </div>

          </div>

          <div className="card-body">
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />

            <Table className="display w-100">
            <thead>
  <tr>
    <th onClick={sortAdminsByEmail} style={{ cursor: "pointer" }}>
      Email
      <span className="ms-1">
        {sortOrder === "asc" ? <i className="fa fa-arrow-up" /> : <i className="fa fa-arrow-down" />}
      </span>
    </th>
    <th>Password</th>
    <th>Verified</th>
    <th>Blocked</th>
    <th>Actions</th>
  </tr>
</thead>

        {/* Modal Détails

<tbody>
  <tr>
    <td colSpan="3">
      <input 
        type="text" 
        className="form-control mt-1"
        placeholder="Search by Email"
        value={emailFilter} 
        onChange={e => setEmailFilter(e.target.value)} 
      />
    </td>
  </tr>
</tbody>  
                  <td>{admin.archived ? "📂 Archived" : "✅ Active"}</td> 
*/}


              <tbody>
                {paginatedAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.email}</td>
                    <td onClick={() => togglePasswordVisibility(admin.id)} style={{ cursor: "pointer" }}>
                    {visiblePasswords[admin.id] ? admin.password : "•••••••••"}
                  </td>              
                        <td>{admin.isEmailVerified ? "Yes" : "No"}</td>
                  <td>{admin.blocked ? "Yes" : "No"}</td>

                    <td>
                      <Button className="btn btn-google shadow btn-xs sharp me-2" onClick={() => handleView(admin)}>
                        <i className="fa fa-eye"></i>
                      </Button>
                      <Button className="btn btn-reddit shadow btn-xs sharp me-2" onClick={() => handleEdit(admin)}>
                        <i className="fa fa-pencil"></i>
                      </Button>

                      <Button className={`btn ${admin.archived ? "btn-danger" : "btn-warning"} shadow btn-xs sharp me-2`} onClick={() => handleArchiveOrDelete(admin)}>
                       <i className={`fa ${admin.archived ? "fa-trash" : "fa-archive"}`}></i>
                      </Button>


                      <Button className="btn btn-dark shadow btn-xs sharp me-2" onClick={() => toggleBlock(admin)}>
  <i className={`fa ${admin.blocked ? "fa-unlock" : "fa-lock"}`}></i>
</Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between mt-3">
              <Button onClick={prevPage} disabled={currentPage === 1}>Prev</Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button onClick={nextPage} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
