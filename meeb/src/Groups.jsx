import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import AuthButton from "./components/auth/AuthButton";
import AuthInput from "./components/auth/AuthInput";
import GroupCard from "./components/groups/GroupCard";
import GroupsPageLayout from "./components/groups/GroupsPageLayout";
import SectionCard from "./components/groups/SectionCard";

function normalizeOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value).trim();
  if (!text || text.toLowerCase() === "none" || text.toLowerCase() === "null") {
    return "";
  }

  return text;
}

function getUserName(user) {
  if (!user) {
    return "Unknown user";
  }

  return user.displayName || user.email?.split("@")[0] || user.email || "Unknown user";
}

export default function Groups() {
  const user = auth.currentUser;
  const [groups, setGroups] = useState([]);
  const [memberGroupIds, setMemberGroupIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "" });
  const [joinGroupId, setJoinGroupId] = useState("");
  const createButtonRef = useRef(null);
  const joinButtonRef = useRef(null);
  const createPanelRef = useRef(null);
  const joinPanelRef = useRef(null);

  const loadGroups = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const membershipsQuery = query(
        collection(db, "Memberships"),
        where("userId", "==", user.uid)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const groupIds = [
        ...new Set(
          membershipsSnapshot.docs
            .map((membershipDoc) => membershipDoc.data().groupId)
            .filter(Boolean)
        ),
      ];

      setMemberGroupIds(groupIds);

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const groupSnapshots = await Promise.all(
        groupIds.map((groupId) => getDoc(doc(db, "Groups", groupId)))
      );

      const nextGroups = groupSnapshots
        .filter((groupDoc) => groupDoc.exists())
        .map((groupDoc) => {
          const data = groupDoc.data();
          const ownerUid = data.owner || "";

          return {
            id: data.id || groupDoc.id,
            pictureUrl: normalizeOptionalText(data.pictureUrl),
            name: data.name || "Untitled Group",
            description: normalizeOptionalText(data.description),
            owner:
              normalizeOptionalText(data.ownerName) ||
              (ownerUid === user.uid ? getUserName(user) : "Unknown user"),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setGroups(nextGroups);
    } catch (err) {
      setError(err?.message ?? "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (!showCreate && !showJoin) {
      return;
    }

    function onPointerDown(event) {
      const target = event.target;
      const inCreateButton = createButtonRef.current?.contains(target);
      const inJoinButton = joinButtonRef.current?.contains(target);
      const inCreatePanel = createPanelRef.current?.contains(target);
      const inJoinPanel = joinPanelRef.current?.contains(target);

      if (inCreateButton || inJoinButton || inCreatePanel || inJoinPanel) {
        return;
      }

      setShowCreate(false);
      setShowJoin(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showCreate, showJoin]);

  async function onCreateGroup(e) {
    e.preventDefault();
    if (!user) {
      return;
    }

    setCreating(true);
    setError("");
    setNotice("");

    try {
      const groupRef = doc(collection(db, "Groups"));
      const newGroup = {
        id: groupRef.id,
        name: createForm.name.trim(),
        description: null,
        pictureUrl: null,
        owner: user.uid,
        ownerName: getUserName(user),
      };

      await setDoc(groupRef, newGroup);
      await addDoc(collection(db, "Memberships"), {
        userId: user.uid,
        groupId: groupRef.id,
      });

      setCreateForm({ name: "" });
      setNotice("Group created successfully.");
      setShowCreate(false);
      await loadGroups();
    } catch (err) {
      setError(err?.message ?? "Failed to create group.");
    } finally {
      setCreating(false);
    }
  }

  async function onJoinGroup(e) {
    e.preventDefault();
    if (!user) {
      return;
    }

    const groupId = joinGroupId.trim();
    if (!groupId) {
      return;
    }

    setJoining(true);
    setError("");
    setNotice("");

    try {
      if (memberGroupIds.includes(groupId)) {
        setNotice("You are already a member of this group.");
        return;
      }

      const groupDoc = await getDoc(doc(db, "Groups", groupId));
      if (!groupDoc.exists()) {
        setError("Group not found. Check the group ID and try again.");
        return;
      }

      await addDoc(collection(db, "Memberships"), {
        userId: user.uid,
        groupId,
      });

      setJoinGroupId("");
      setNotice("Joined group successfully.");
      setShowJoin(false);
      await loadGroups();
    } catch (err) {
      setError(err?.message ?? "Failed to join group.");
    } finally {
      setJoining(false);
    }
  }

  const groupsToRender = groups;
  const isEmptyState = !loading && groupsToRender.length === 0;

  return (
    <GroupsPageLayout>
      <div className="mx-auto h-full w-full max-w-md">
        <div
          className={`h-full rounded-3xl border border-[#e6dfd4] bg-white p-5 flex flex-col ${
            isEmptyState ? "min-h-[72dvh]" : "space-y-4"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Your groups</p>
            <div className="flex items-center gap-2">
              <button
                ref={createButtonRef}
                onClick={() => {
                  setShowCreate((prev) => !prev);
                  setShowJoin(false);
                }}
                className={`rounded-xl border px-3 py-1.5 text-xs transition active:scale-[0.99] ${
                  showCreate
                    ? "border-[#d6cbbd] bg-[#f2ece4] text-neutral-800"
                    : "border-[#e6dfd4] bg-[#faf7f2] text-neutral-700 hover:bg-[#f2ece4]"
                }`}
              >
                Create group
              </button>
              <button
                ref={joinButtonRef}
                onClick={() => {
                  setShowJoin((prev) => !prev);
                  setShowCreate(false);
                }}
                className={`rounded-xl border px-3 py-1.5 text-xs transition active:scale-[0.99] ${
                  showJoin
                    ? "border-[#d6cbbd] bg-[#f2ece4] text-neutral-800"
                    : "border-[#e6dfd4] bg-[#faf7f2] text-neutral-700 hover:bg-[#f2ece4]"
                }`}
              >
                Join group
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col space-y-4">
            {error ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            ) : null}

            {showCreate ? (
              <div ref={createPanelRef}>
                <SectionCard title="Create group">
                <form onSubmit={onCreateGroup} className="space-y-3">
                  <AuthInput
                    placeholder="Group name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <AuthButton type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create group"}
                  </AuthButton>
                </form>
                </SectionCard>
              </div>
            ) : null}

            {showJoin ? (
              <div ref={joinPanelRef}>
                <SectionCard title="Join group">
                <form onSubmit={onJoinGroup} className="space-y-3">
                  <AuthInput
                    placeholder="Group ID"
                    value={joinGroupId}
                    onChange={(e) => setJoinGroupId(e.target.value)}
                    required
                  />
                  <AuthButton type="submit" disabled={joining}>
                    {joining ? "Joining..." : "Join group"}
                  </AuthButton>
                </form>
                </SectionCard>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-[#e8dfd3] border-t-[#cfc4b8]"
                  aria-label="Loading groups"
                />
              </div>
            ) : groupsToRender.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-3 text-center text-[#8a8175]">
                <p className="text-2xl font-semibold tracking-tight">No groups yet.</p>
                <p className="mt-2 text-xs">
                  Start by tapping <span className="text-neutral-800">Create group</span>, or
                  join an existing one with a group ID.
                </p>
              </div>
            ) : (
              <div className="mt-2 min-h-0 space-y-3 overflow-y-auto pr-1">
                {groupsToRender.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={() => signOut(auth)}
              className="rounded-xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-[#f2ece4] active:scale-[0.99]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </GroupsPageLayout>
  );
}
