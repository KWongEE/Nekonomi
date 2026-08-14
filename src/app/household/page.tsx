import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyHousehold } from "./actions";
import { CreateHouseholdForm } from "./CreateHouseholdForm";
import { JoinHouseholdForm } from "./JoinHouseholdForm";
import { RegenerateCodeButton } from "./RegenerateCodeButton";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { LeaveHouseholdButton } from "./LeaveHouseholdButton";
import { HomeLink } from "@/components/HomeLink";

export const metadata = {
  title: "Household — Nekonomi",
  description: "Share your pantry, recipes, and grocery list with your household.",
};

export default async function HouseholdPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const myUserId = session.user.id;

  const my = await getMyHousehold();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">
        <HomeLink />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            🏠 Household
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {my
              ? "Everyone here shares one pantry, recipe book, and grocery list."
              : "Create or join a household to share your pantry, recipes, and grocery list."}
          </p>
        </div>

        {!my && (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Create a Household
              </h2>
              <CreateHouseholdForm />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                Join a Household
              </h2>
              <JoinHouseholdForm />
            </div>
          </>
        )}

        {my && (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-1 text-lg font-semibold text-slate-50">{my.household.name}</h2>
              <p className="text-sm text-slate-400">
                {my.members.length} member{my.members.length === 1 ? "" : "s"}
              </p>

              {my.isCreator && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Invite Code</p>
                  <p className="mt-1 font-mono text-2xl tracking-[0.3em] text-amber-400">
                    {my.household.inviteCode}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Share this code — anyone who enters it on their own Join Household screen
                    gets added.
                  </p>
                  <div className="mt-3">
                    <RegenerateCodeButton />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-800 px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Members
                </h2>
              </div>
              {my.members.map((member, i) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between px-5 py-3 ${
                    i !== 0 ? "border-t border-slate-800/60" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {member.name ?? member.email}
                      {member.id === my.household.createdBy && (
                        <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                          Creator
                        </span>
                      )}
                    </p>
                    {member.name && <p className="text-xs text-slate-500">{member.email}</p>}
                  </div>
                  {my.isCreator && member.id !== myUserId && (
                    <RemoveMemberButton memberId={member.id} />
                  )}
                </div>
              ))}
            </div>

            <LeaveHouseholdButton />
          </>
        )}
      </div>
    </div>
  );
}
