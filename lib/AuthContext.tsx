"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  role: string | null;
  loading: boolean;
  features: {
    inventory: boolean;
    kds: boolean;
    takeaway: boolean;
    qrMenu: boolean;
    analytics: boolean;
    staff: boolean;
  } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenantId: null,
  role: null,
  loading: true,
  features: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [features, setFeatures] = useState<{
    inventory: boolean;
    kds: boolean;
    takeaway: boolean;
    qrMenu: boolean;
    analytics: boolean;
    staff: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Look up this user in the Firestore 'users' collection
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        // console.log("FIREBASE USER UID:", firebaseUser.uid);

        if (userDoc.exists()) {
          const uData = userDoc.data();
          const tId = uData.tenantId;
          setTenantId(tId);
          setRole(uData.role);

          if (tId) {
            const tenantDoc = await getDoc(doc(db, "tenants", tId));
            if (tenantDoc.exists() && tenantDoc.data().features) {
              setFeatures(tenantDoc.data().features);
            } else {
              setFeatures({
                inventory: true,
                kds: true,
                takeaway: true,
                qrMenu: true,
                analytics: true,
                staff: true,
              });
            }
          } else {
            setFeatures(null);
          }
        } 
      } else {
        console.log("NO USER LOGGED IN");
        setUser(null);
        setTenantId(null);
        setRole(null);
        setFeatures(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenantId, role, loading, features }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);