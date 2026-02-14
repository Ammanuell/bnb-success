import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import Login from "./Login.jsx";
import Groups from "./Groups.jsx";
import GroupDashboard from "./GroupDashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/groups" replace />}
      />
      <Route
        path="/groups"
        element={user ? <Groups /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/groups/:groupId"
        element={user ? <GroupDashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to={user ? "/groups" : "/login"} replace />} />
    </Routes>
  );
}
