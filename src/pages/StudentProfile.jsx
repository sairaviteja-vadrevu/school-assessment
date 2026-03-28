import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, BookOpen, Award, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const getGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};
const getGradeVariant = (g) => {
  if (g === 'A+' || g === 'A') return 'success';
  if (g === 'F') return 'danger';
  return 'info';
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentData, assessData, attendData] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/assessments/student/${id}`),
          api.get(`/attendance/student?student_id=${id}`),
        ]);
        setStudent(studentData);
        setAssessments(assessData || []);
        setAttendance(attendData || []);
      } catch (e) {
        console.error('Failed to load student:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>${student?.name} - Report Card</title>
          <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Manrope', sans-serif; padding: 40px; color: #004493; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #D6E4F0; font-size: 13px; }
            th { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #5A7AA5; background: #f3faff; }
            .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #004493; }
            .header h1 { font-size: 24px; font-weight: 800; }
            .header p { font-size: 14px; color: #5A7AA5; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
            .stats { display: flex; gap: 16px; margin-bottom: 24px; }
            .stat { flex: 1; text-align: center; padding: 16px; background: #f3faff; border-radius: 10px; }
            .stat-value { font-size: 24px; font-weight: 800; }
            .stat-label { font-size: 11px; color: #5A7AA5; margin-top: 4px; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
            .badge-success { background: #ECFDF5; color: #059669; }
            .badge-danger { background: #FEF2F2; color: #DC2626; }
            .badge-info { background: #E8F0FE; color: #004493; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #D6E4F0; font-size: 12px; color: #5A7AA5; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Bhaskar School
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>;
  if (!student) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Student not found</div>;

  // Calculate stats
  const totalAssessments = assessments.length;
  const subjects = [...new Set(assessments.map(a => a.subject))];
  const overallAvg = totalAssessments > 0
    ? (assessments.reduce((sum, a) => sum + (a.marks / a.total_marks) * 100, 0) / totalAssessments).toFixed(1)
    : 0;
  const overallGrade = getGrade(parseFloat(overallAvg));

  // Group by subject
  const subjectGroups = {};
  assessments.forEach(a => {
    if (!subjectGroups[a.subject]) subjectGroups[a.subject] = [];
    subjectGroups[a.subject].push(a);
  });

  // Attendance stats
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const lateDays = attendance.filter(a => a.status === 'late').length;
  const totalDays = attendance.length;
  const attendancePct = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-family)' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#004493', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Student Info Card */}
        <div className="header" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#004493', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, margin: '0 auto 16px' }}>
            {student.name?.substring(0, 2).toUpperCase()}
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--color-text)' }}>{student.name}</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {student.class_name} {student.section ? `(${student.section})` : ''} · Roll No: {student.roll_number} · Grade {student.grade}
          </p>
        </div>

        {/* Stats */}
        <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Overall Average', value: `${overallAvg}%`, color: parseFloat(overallAvg) >= 60 ? '#059669' : '#DC2626' },
            { label: 'Overall Grade', value: overallGrade, color: '#004493' },
            { label: 'Total Exams', value: totalAssessments, color: '#004493' },
            { label: 'Subjects', value: subjects.length, color: '#004493' },
            { label: 'Attendance', value: `${attendancePct}%`, color: parseFloat(attendancePct) >= 75 ? '#059669' : '#DC2626' },
          ].map(s => (
            <div key={s.label} className="stat" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', textAlign: 'center' }}>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject-wise Breakdown */}
        {Object.entries(subjectGroups).map(([subject, records]) => {
          const avg = (records.reduce((s, r) => s + (r.marks / r.total_marks) * 100, 0) / records.length).toFixed(1);
          const subGrade = getGrade(parseFloat(avg));
          return (
            <div key={subject} className="section" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="section-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} /> {subject}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Avg: <strong style={{ color: parseFloat(avg) >= 60 ? '#059669' : '#DC2626' }}>{avg}%</strong></span>
                  <Badge variant={getGradeVariant(subGrade)}>{subGrade}</Badge>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Exam Type', 'Date', 'Marks', 'Percentage', 'Grade'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const pct = ((r.marks / r.total_marks) * 100).toFixed(1);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>{r.exam_type}</td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{r.marks}/{r.total_marks}</td>
                        <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600, color: parseFloat(pct) >= 60 ? '#059669' : parseFloat(pct) < 40 ? '#DC2626' : 'var(--color-text)' }}>{pct}%</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge badge-${getGradeVariant(r.grade)}`}><Badge variant={getGradeVariant(r.grade)}>{r.grade}</Badge></span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {totalAssessments === 0 && (
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No assessments recorded for this student yet.
          </div>
        )}

        {/* Attendance Summary */}
        {totalDays > 0 && (
          <div className="section" style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '24px', marginTop: '16px' }}>
            <h3 className="section-title" style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Attendance Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Present', value: presentDays, color: '#059669' },
                { label: 'Late', value: lateDays, color: '#D97706' },
                { label: 'Absent', value: absentDays, color: '#DC2626' },
                { label: 'Total Days', value: totalDays, color: '#004493' },
              ].map(s => (
                <div key={s.label} className="stat" style={{ backgroundColor: 'var(--color-background)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div className="stat-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
