import React, { useState, useRef } from 'react';
import type { CourseData, ComponentPolicy } from '../types';
import { useCourses } from '../context/CourseContext';
import { mockStudent } from '../services/mockData';
import { extractPolicyDetailsFromPdf } from '../utils/pdfParser';
import { X, Plus, Trash2, BookOpen, Layers, CheckCircle, AlertCircle, Sparkles, Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated?: (courseId: string) => void;
}

const TEMPLATES = [
  {
    name: 'Standard Format (50% ICA + 50% TEE)',
    desc: 'Attendance (5%), Assignment 1 (10%), Midterm (15%), Lab (10%), Project (10%) + TEE (50%)',
    components: [
      { name: 'Attendance', type: 'attendance', weight: 5, rules: { required: true, minimum_percentage: 75 } },
      { name: 'Assignment 1 (ICA 1)', type: 'assignment', weight: 10 },
      { name: 'Midterm Exam (ICA 2)', type: 'exam', weight: 15 },
      { name: 'Lab Practicals (ICA 3)', type: 'lab', weight: 10 },
      { name: 'Course Project (ICA 4)', type: 'project', weight: 10 },
      { name: 'Term End Examination (TEE)', type: 'exam', weight: 50 }
    ] as ComponentPolicy[]
  },
  {
    name: 'Institutional 6-Unit Scheme (Class Tests + Term-work)',
    desc: 'Class Test-1 (10), Class Test-2 (10), Lab Submissions (10), Class Participation (5), Mini Project (5), Lab Exam (10) + TEE (50)',
    components: [
      { name: 'Class Test-1', type: 'exam', weight: 10 },
      { name: 'Class Test-2', type: 'exam', weight: 10 },
      { name: 'Lab Submissions /Practicals', type: 'lab', weight: 10 },
      { name: 'Class Participation', type: 'attendance', weight: 5, rules: { required: true, minimum_percentage: 75 } },
      { name: 'Mini Project', type: 'project', weight: 5 },
      { name: 'Lab Exam', type: 'exam', weight: 10 },
      { name: 'Term End Examination (TEE)', type: 'exam', weight: 50 }
    ] as ComponentPolicy[]
  },
  {
    name: 'Lab & Practical Format (50% ICA + 50% TEE)',
    desc: 'Attendance (5%), Lab Journal (15%), Midterm Practical (15%), Project (15%) + TEE Theory (50%)',
    components: [
      { name: 'Attendance', type: 'attendance', weight: 5, rules: { required: true, minimum_percentage: 80 } },
      { name: 'Lab Journal & Submissions (ICA 1)', type: 'lab', weight: 15 },
      { name: 'Midterm Practical Exam (ICA 2)', type: 'exam', weight: 15 },
      { name: 'Capstone Implementation (ICA 3)', type: 'project', weight: 15 },
      { name: 'Term End Examination (TEE)', type: 'exam', weight: 50 }
    ] as ComponentPolicy[]
  }
];

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onCourseCreated }) => {
  const { createCourse, coursesDict } = useCourses();

  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [semester, setSemester] = useState(5);
  const [initialAttendance, setInitialAttendance] = useState(100);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedBanner, setExtractedBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [components, setComponents] = useState<ComponentPolicy[]>(() => [
    { name: 'Attendance', type: 'attendance', weight: 5, rules: { required: true, minimum_percentage: 75 } },
    { name: 'Assignment 1 (ICA 1)', type: 'assignment', weight: 10 },
    { name: 'Midterm Exam (ICA 2)', type: 'exam', weight: 15 },
    { name: 'Lab Practicals (ICA 3)', type: 'lab', weight: 10 },
    { name: 'Course Project (ICA 4)', type: 'project', weight: 10 },
    { name: 'Term End Examination (TEE)', type: 'exam', weight: 50 }
  ]);

  if (!isOpen) return null;

  const totalWeight = components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const icaWeight = components
    .filter(c => !c.name.toLowerCase().includes('end semester') && !c.name.toLowerCase().includes('term end') && !c.name.toLowerCase().includes('ese') && !c.name.toLowerCase().includes('tee'))
    .reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const teeWeight = totalWeight - icaWeight;

  const handleApplyTemplate = (templateIndex: number) => {
    setComponents(JSON.parse(JSON.stringify(TEMPLATES[templateIndex].components)));
  };

  const handleAddComponent = () => {
    setComponents(prev => [
      ...prev,
      { name: `Component ${prev.length + 1}`, type: 'assignment', weight: 10 }
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof ComponentPolicy, val: any) => {
    setComponents(prev => prev.map((c, i) => i === index ? { ...c, [field]: val } : c));
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractedBanner(null);
    try {
      const details = await extractPolicyDetailsFromPdf(file);
      if (details.policy) {
        setCourseId(details.policy.course_id || '');
        setCourseName(details.policy.course_name || '');
        if (details.policy.semester) setSemester(details.policy.semester);
        if (details.policy.faculty) setFaculty(details.policy.faculty);
        if (details.policy.components && details.policy.components.length > 0) {
          setComponents(details.policy.components);
        }
        setExtractedBanner(`Policy Identified: ${details.schemeTitle || 'Assessment and Evaluation Scheme'} (${details.icaSubtotal}M ICA + ${details.teeSubtotal}M TEE)`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to parse syllabus PDF.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedId = courseId.trim().toUpperCase().replace(/\s+/g, '');
    const trimmedName = courseName.trim();

    if (!trimmedId) {
      alert('Please provide a Course Code / ID (e.g., CS301, DS401).');
      return;
    }
    if (!trimmedName) {
      alert('Please provide a Course Name.');
      return;
    }

    if (coursesDict[trimmedId]) {
      if (!window.confirm(`A course with ID "${trimmedId}" already exists. Overwrite it?`)) {
        return;
      }
    }

    if (totalWeight !== 100) {
      if (!window.confirm(`Total component weight is currently ${totalWeight}%, not 100%. Are you sure you want to proceed?`)) {
        return;
      }
    }

    const newCourse: CourseData = {
      policy: {
        course_id: trimmedId,
        course_name: trimmedName,
        semester: Number(semester) || 5,
        faculty: faculty.trim() || 'Faculty Instructor',
        components
      },
      attendance: {
        course_id: trimmedId,
        student_id: mockStudent.student_id,
        percentage: Math.min(100, Math.max(0, Number(initialAttendance) || 100))
      },
      assessments: []
    };

    createCourse(newCourse);
    onClose();

    if (onCourseCreated) {
      onCourseCreated(trimmedId);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'var(--accent-glow)', color: 'var(--accent-light)', borderRadius: '10px' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>Add New Course</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Configure course syllabus details and its ICA components
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Quick Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label">Course Code / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS305, SE201"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Faculty / Instructor</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. R. Sharma"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Initial Attendance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={initialAttendance}
                  onChange={(e) => setInitialAttendance(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            {/* Preset Syllabus Templates & PDF Import */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              borderRadius: '14px', 
              padding: '16px 18px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} className="text-accent" /> Quick Syllabus Presets or Upload PDF
                </label>

                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePdfUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="btn-secondary"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '7px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      color: 'var(--accent-light)'
                    }}
                  >
                    {isExtracting ? (
                      <><Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Parsing Policy PDF...</>
                    ) : (
                      <><Upload size={14} /> Upload Policy PDF</>
                    )}
                  </button>
                </div>
              </div>

              {extractedBanner && (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.09)', 
                  border: '1px solid rgba(16, 185, 129, 0.35)', 
                  borderRadius: '10px', 
                  padding: '9px 14px', 
                  marginBottom: '12px',
                  fontSize: '0.82rem',
                  color: '#a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>{extractedBanner}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(idx)}
                    className="template-select-btn"
                    title={tmpl.desc}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ICA & Assessment Components Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} className="text-accent" />
                  <label className="form-label" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                    Assessment Components & Weight Breakdown
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="ica-tag">
                    ICA: {icaWeight}% / 50%
                  </span>
                  <span className="non-ica-tag">
                    TEE: {teeWeight}% / 50%
                  </span>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: totalWeight === 100 && icaWeight === 50 && teeWeight === 50 ? 'var(--success)' : 'var(--warning)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: totalWeight === 100 && icaWeight === 50 && teeWeight === 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '6px',
                      border: `1px solid ${totalWeight === 100 && icaWeight === 50 && teeWeight === 50 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}
                  >
                    {totalWeight === 100 && icaWeight === 50 && teeWeight === 50 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    Total: {totalWeight}% / 100%
                  </span>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="add-comp-btn"
                    title="Add custom component"
                  >
                    <Plus size={14} /> Add Component
                  </button>
                </div>
              </div>

              {/* Column Labels */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '56px 1fr 145px 84px 38px', 
                gap: '10px', 
                padding: '0 12px 6px 12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <span>Scope</span>
                <span>Component Label</span>
                <span>Category</span>
                <span style={{ textAlign: 'right' }}>Weight</span>
                <span></span>
              </div>

              <div className="components-builder-list">
                {components.map((comp, idx) => {
                  const isIca = !comp.name.toLowerCase().includes('end semester') && !comp.name.toLowerCase().includes('term end') && !comp.name.toLowerCase().includes('ese') && !comp.name.toLowerCase().includes('tee');

                  return (
                    <div key={idx} className="builder-component-row">
                      <span className={isIca ? 'ica-tag' : 'non-ica-tag'}>
                        {isIca ? 'ICA' : 'TEE'}
                      </span>

                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Class Test-1"
                        className="builder-input"
                      />

                      <select
                        value={comp.type}
                        onChange={(e) => handleComponentChange(idx, 'type', e.target.value)}
                        className="builder-select"
                      >
                        <option value="exam">Exam</option>
                        <option value="lab">Lab / Practical</option>
                        <option value="attendance">Attendance</option>
                        <option value="project">Project</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={comp.weight}
                          onChange={(e) => handleComponentChange(idx, 'weight', Number(e.target.value))}
                          className="builder-weight-input"
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="builder-delete-btn"
                        title="Remove component"
                        disabled={components.length <= 1}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
