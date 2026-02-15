import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import GroupsPageLayout from "./components/groups/GroupsPageLayout";

const TABS = ["Balances", "Expenses", "Activity"];

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

function getDisplayName(userId, userDocData) {
  const currentUser = auth.currentUser;
  if (currentUser?.uid === userId) {
    return (
      currentUser.displayName ||
      currentUser.email?.split("@")[0] ||
      currentUser.email ||
      "You"
    );
  }

  return (
    normalizeOptionalText(userDocData?.displayName) ||
    normalizeOptionalText(userDocData?.name) ||
    normalizeOptionalText(userDocData?.fullName) ||
    `Member ${userId.slice(0, 6)}`
  );
}

function getAvatarUrl(userDocData) {
  return (
    normalizeOptionalText(userDocData?.photoURL) ||
    normalizeOptionalText(userDocData?.avatarUrl) ||
    normalizeOptionalText(userDocData?.pictureUrl)
  );
}

function formatBalance(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function balanceColorClass(balance) {
  if (balance > 0) {
    return "text-emerald-600";
  }

  if (balance < 0) {
    return "text-red-600";
  }

  return "text-neutral-400";
}

function Avatar({ src, alt }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-10 w-10 rounded-full border border-[#e6dfd4] bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6dfd4] bg-[#faf7f2] text-neutral-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
        <path
          fillRule="evenodd"
          d="M3.75 19.5A5.25 5.25 0 0 1 9 14.25h6a5.25 5.25 0 0 1 5.25 5.25.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function GroupDashboard() {
  const { groupId } = useParams();
  const user = auth.currentUser;
  const [activeTab, setActiveTab] = useState("Balances");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTxComposer, setShowTxComposer] = useState(false);
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [savingTx, setSavingTx] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const groupDoc = await getDoc(doc(db, "Groups", groupId));
      if (!groupDoc.exists()) {
        setError("Group not found.");
        setGroup(null);
        setMembers([]);
        setTransactions([]);
        return;
      }

      const groupData = groupDoc.data();
      setGroup({
        id: groupDoc.id,
        name: groupData.name || "Untitled Group",
        pictureUrl: normalizeOptionalText(groupData.pictureUrl),
      });

      const membershipsQuery = query(
        collection(db, "Memberships"),
        where("groupId", "==", groupId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const memberIds = [
        ...new Set(
          membershipsSnapshot.docs
            .map((membershipDoc) => membershipDoc.data().userId)
            .filter(Boolean)
        ),
      ];

      const userDocs = await Promise.all(
        memberIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, "Users", userId));
            return { userId, data: userDoc.exists() ? userDoc.data() : null };
          } catch {
            return { userId, data: null };
          }
        })
      );

      setMembers(
        userDocs
          .map(({ userId, data }) => ({
            id: userId,
            name: getDisplayName(userId, data),
            avatarUrl: getAvatarUrl(data),
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      const transactionsQuery = query(
        collection(db, "transactions"),
        where("groupId", "==", groupId)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const nextTransactions = transactionsSnapshot.docs
        .map((transactionDoc) => {
          const data = transactionDoc.data();
          return {
            id: transactionDoc.id,
            madeBy: data.madeBy || "",
            groupId: data.groupId || "",
            description: normalizeOptionalText(data.description),
            amount: Number(data.amount) || 0,
            type: data.type || "",
            forUserId: data.forUserId || null,
            createdAt: data.createdAt || null,
          };
        })
        .sort((a, b) => {
          const aMs =
            typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
          const bMs =
            typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
          return bMs - aMs;
        });

      setTransactions(nextTransactions);
    } catch (err) {
      setError(err?.message ?? "Failed to load group dashboard.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      loadDashboard();
    }
  }, [groupId, loadDashboard]);

  async function onCreatePurchase(e) {
    e.preventDefault();
    if (!user?.uid) {
      return;
    }

    const amount = Number(txAmount);
    const description = txDescription.trim();
    if (!description || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount and description.");
      return;
    }

    setSavingTx(true);
    setError("");
    setNotice("");

    try {
      await addDoc(collection(db, "transactions"), {
        madeBy: user.uid,
        groupId,
        description,
        amount,
        type: "purchase",
        forUserId: null,
        createdAt: serverTimestamp(),
      });

      setTxAmount("");
      setTxDescription("");
      setShowTxComposer(false);
      setNotice("Transaction added.");
      await loadDashboard();
    } catch (err) {
      setError(err?.message ?? "Failed to add transaction.");
    } finally {
      setSavingTx(false);
    }
  }

  const memberNameById = useMemo(
    () =>
      members.reduce((acc, member) => {
        acc[member.id] = member.name;
        return acc;
      }, {}),
    [members]
  );

  const membersWithBalances = useMemo(() => {
    const n = members.length;
    const totalByUser = new Map();
    const purchaseByUser = new Map();
    const settlementToUserByOthers = new Map();

    for (const tx of transactions) {
      const madeBy = tx.madeBy;
      const amount = Number(tx.amount) || 0;

      if (madeBy) {
        totalByUser.set(madeBy, (totalByUser.get(madeBy) || 0) + amount);
      }

      if (tx.type === "purchase" && madeBy) {
        purchaseByUser.set(madeBy, (purchaseByUser.get(madeBy) || 0) + amount);
      }

      if (tx.type === "settlement" && tx.forUserId && madeBy && madeBy !== tx.forUserId) {
        settlementToUserByOthers.set(
          tx.forUserId,
          (settlementToUserByOthers.get(tx.forUserId) || 0) + amount
        );
      }
    }

    const totalPurchaseAll = Array.from(purchaseByUser.values()).reduce(
      (sum, value) => sum + value,
      0
    );

    return members.map((member) => {
      const totalMade = totalByUser.get(member.id) || 0;
      const ownPurchases = purchaseByUser.get(member.id) || 0;
      const othersPurchases = totalPurchaseAll - ownPurchases;
      const shareOfOthers = n > 1 ? othersPurchases / (n - 1) : 0;
      const settlementsFromOthers = settlementToUserByOthers.get(member.id) || 0;

      return {
        ...member,
        balance: -1 * (totalMade - shareOfOthers - settlementsFromOthers),
      };
    });
  }, [members, transactions]);

  const purchaseTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === "purchase"),
    [transactions]
  );

  const tabContent = useMemo(() => {
    if (activeTab === "Balances") {
      if (membersWithBalances.length === 0) {
        return <p className="text-sm text-neutral-500">No members in this group yet.</p>;
      }

      return (
        <div className="space-y-2">
          {membersWithBalances.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={member.avatarUrl} alt={member.name} />
                <p className="truncate text-sm font-medium text-neutral-800">{member.name}</p>
              </div>
              <p className={`text-sm font-semibold ${balanceColorClass(member.balance)}`}>
                {formatBalance(member.balance)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "Expenses") {
      if (purchaseTransactions.length === 0) {
        return <p className="text-sm text-neutral-500">No expenses yet.</p>;
      }

      return (
        <div className="space-y-2">
          {purchaseTransactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {tx.description || "Expense"}
                </p>
                <p className="text-sm font-semibold text-neutral-800">{formatBalance(tx.amount)}</p>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Paid by {memberNameById[tx.madeBy] || `Member ${tx.madeBy?.slice(0, 6) || "?"}`}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (transactions.length === 0) {
      return <p className="text-sm text-neutral-500">No activity yet.</p>;
    }

    return (
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-neutral-800">
                {tx.description || "Transaction"}
              </p>
              <p className="text-sm font-semibold text-neutral-800">{formatBalance(tx.amount)}</p>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {tx.type || "unknown"} by{" "}
              {memberNameById[tx.madeBy] || `Member ${tx.madeBy?.slice(0, 6) || "?"}`}
            </p>
          </div>
        ))}
      </div>
    );
  }, [
    activeTab,
    memberNameById,
    membersWithBalances,
    purchaseTransactions,
    transactions,
  ]);

  return (
    <GroupsPageLayout>
      <div className="mx-auto h-full w-full max-w-md">
        <div className="relative h-full rounded-3xl border border-[#e6dfd4] bg-white p-5">
          <div className="mb-4">
            <Link
              to="/groups"
              className="inline-block rounded-xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-[#f2ece4]"
            >
              Back to groups
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-[#e8dfd3] border-t-[#cfc4b8]"
                aria-label="Loading group dashboard"
              />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="flex h-[calc(100%-3rem)] flex-col pb-24">
              <h1 className="text-center text-2xl font-semibold tracking-tight text-neutral-800">
                {group?.name || "Untitled Group"}
              </h1>

              {group?.pictureUrl ? (
                <img
                  src={group.pictureUrl}
                  alt={group.name}
                  className="mx-auto mt-4 h-28 w-28 rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              <div className="mt-5 flex rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] p-1">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-xl px-2 py-1.5 text-sm transition ${
                      activeTab === tab
                        ? "bg-white font-medium text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{tabContent}</div>
            </div>
          )}

          {notice && !loading && !error ? (
            <div className="absolute bottom-20 left-5 right-5 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {notice}
            </div>
          ) : null}

          {!loading && !error && showTxComposer ? (
            <form
              onSubmit={onCreatePurchase}
              className="absolute bottom-5 left-5 right-5 rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] px-3 py-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <span>You have paid $</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-20 rounded-lg border border-[#dfd6c8] bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-[#bba98f]"
                  placeholder="0.00"
                  required
                />
                <span>for</span>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#dfd6c8] bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-[#bba98f]"
                  placeholder="what?"
                  required
                />
                <button
                  type="submit"
                  disabled={savingTx}
                  aria-label="Confirm transaction"
                  className="rounded-full border border-[#d6cbbd] bg-white p-2 text-neutral-800 transition hover:bg-[#f4eee6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.28 4.22a.75.75 0 0 1 1.06 0l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 1 1-1.06-1.06l5.97-5.97H3a.75.75 0 0 1 0-1.5h16.25l-5.97-5.97a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </form>
          ) : !loading && !error ? (
            <button
              type="button"
              onClick={() => {
                setNotice("");
                setShowTxComposer(true);
              }}
              className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#d6cbbd] bg-[#faf7f2] text-neutral-700 shadow-sm transition hover:bg-[#f2ece4]"
              aria-label="Make transaction"
              title="Make transaction"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M2.25 4.5A2.25 2.25 0 0 1 4.5 2.25h15A2.25 2.25 0 0 1 21.75 4.5v2.25H2.25V4.5Z" />
                <path
                  fillRule="evenodd"
                  d="M2.25 8.25h19.5v11.25A2.25 2.25 0 0 1 19.5 21.75h-15A2.25 2.25 0 0 1 2.25 19.5V8.25Zm6 3a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </GroupsPageLayout>
  );
}
