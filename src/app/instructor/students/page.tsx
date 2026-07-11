import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatPercent } from "@/lib/utils";

export default async function InstructorStudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*, course_progress(percentage, courses(title))")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-200">Academy Students</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Students</h1>
        <p className="mt-2 text-slate-400">View enrolled students and course progress.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-slate-800 text-start text-slate-400">
                <tr>
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Course</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(students || []).map((student) => (
                  <tr key={student.id} className="border-b border-slate-800 last:border-0">
                    <td className="p-4 text-white">{student.full_name}</td>
                    <td className="p-4 text-slate-400">{student.email}</td>
                    <td className="p-4 text-slate-400">{student.course_progress?.[0]?.courses?.title || "-"}</td>
                    <td className="p-4 text-cyan-200">
                      {formatPercent(student.course_progress?.[0]?.percentage || 0)}
                    </td>
                    <td className="p-4 text-end">
                      <Link href={`/instructor/students/${student.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
