import { Link, useParams } from "react-router-dom";
import GroupsPageLayout from "./components/groups/GroupsPageLayout";
import SectionCard from "./components/groups/SectionCard";

export default function GroupDashboard() {
  const { groupId } = useParams();

  return (
    <GroupsPageLayout>
      <SectionCard title="Group dashboard" description="This page is not implemented yet.">
        <p className="text-sm text-neutral-600">Group ID: {groupId}</p>
        <Link
          to="/groups"
          className="mt-4 inline-block rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] px-4 py-2 text-sm text-neutral-700 transition hover:bg-[#f2ece4]"
        >
          Back to groups
        </Link>
      </SectionCard>
    </GroupsPageLayout>
  );
}
