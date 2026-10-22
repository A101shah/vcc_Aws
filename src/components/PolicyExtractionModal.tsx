import React from 'react';
import type { CoursePolicy } from '../types';
import type { ExtractedPolicyResult } from '../utils/pdfParser';
import { isTeeComponent } from '../utils/policyEngine';
import { 
  X, 
  CheckCircle2, 
  Layers, 
  FileCheck, 
  BookOpen, 
  Award, 
  Check 
} from 'lucide-react';

interface PolicyExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExtractedPolicyResult | null;
  onConfirm: (policy: CoursePolicy) => void;
}

export const PolicyExtractionModal: React.FC<PolicyExtractionModalProps> = ({
  isOpen,
  onClose,
  result,
  onConfirm
}) => {
  if (!isOpen || !result) return null;

  const { policy, schemeTitle, icaSubtotal, teeSubtotal } = result;

  const icaComponents = policy.components.filter(c => !isTeeComponent(c));

  const classTests = icaComponents.filter(c => c.name.toLowerCase().includes('class test') || c.name.toLowerCase().includes('ct'));
  const termWork = icaComponents.filter(c => !c.name.toLowerCase().includes('class test') && !c.name.toLowerCase().includes('ct'));

  const classTestsWeight = classTests.reduce((sum, c) => sum + (c.weight || 0), 0);
  const termWorkWeight = termWork.reduce((sum, c) => sum + (c.weight || 0), 0);

  const handleConfirm = () => {
    onConfirm(policy);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: 'var(--accent-light)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <FileCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Policy Ingested: Evaluation Scheme Detected
                </h2>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Verified Pattern
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {schemeTitle || 'Institutional Assessment and Evaluation Scheme extracted from syllabus'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close-btn" 
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">

        {/* Course Identity Preview */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '14px', 
          padding: '16px 20px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-primary" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {policy.course_id}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Semester {policy.semester} • {policy.faculty}
              </span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {policy.course_name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              padding: '6px 14px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '0.68rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>ICA Weight</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#93c5fd' }}>{icaSubtotal} Marks</div>
            </div>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              border: '1px solid rgba(139, 92, 246, 0.3)', 
              padding: '6px 14px', 
              borderRadius: '10px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '0.68rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>TEE Weight</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d8b4fe' }}>{teeSubtotal} Marks</div>
            </div>
          </div>
        </div>

        {/* Evaluation Matrix Visualization */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ 
            fontSize: '0.82rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            color: 'var(--text-muted)', 
            letterSpacing: '0.05em',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Layers size={14} color="var(--accent-light)" /> Identified Scheme Components (100 Marks Total Availability)
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            {/* Table Header: ICA Header */}
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.12)', 
              padding: '12px 18px', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="#60a5fa" />
                <span style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.92rem' }}>
                  Internal Continuous Assessment (ICA)
                </span>
              </div>
              <span className="badge badge-accent" style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                {icaSubtotal} Marks (50%)
              </span>
            </div>

            {/* Sub-groups preview if Class Tests & Term Work present */}
            {classTests.length > 0 && termWork.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.015)' }}>
                {/* Class Tests Column */}
                <div style={{ padding: '14px', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px dashed var(--border-color)' 
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Class Tests</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa' }}>{classTestsWeight} Marks</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {classTests.map((c, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.84rem'
                      }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>{c.weight}M</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Term Work Column */}
                <div style={{ padding: '14px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px dashed var(--border-color)' 
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Term-work / Practicals</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c084fc' }}>{termWorkWeight} Marks</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                    {termWork.map((c, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.84rem'
                      }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        <span style={{ fontWeight: 800, color: '#c084fc', marginLeft: '6px' }}>{c.weight}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Flat component list if not partitioned into class tests / term-work */
              <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
                {icaComponents.map((c, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.84rem'
                  }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>{c.weight}M</span>
                  </div>
                ))}
              </div>
            )}

            {/* Table Footer: TEE Header */}
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.12)', 
              padding: '12px 18px', 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#c084fc" />
                <span style={{ fontWeight: 700, color: '#d8b4fe', fontSize: '0.92rem' }}>
                  Term End Examination (TEE)
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  (University / Autonomous Terminal Exam)
                </span>
              </div>
              <span className="badge badge-secondary" style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                {teeSubtotal} Marks (50%)
              </span>
            </div>
          </div>
        </div>

        {/* Architecture Note */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.06)', 
          border: '1px solid rgba(16, 185, 129, 0.25)', 
          borderRadius: '10px', 
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.82rem',
          marginBottom: '22px'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>
            <strong>Institutional Verification Complete:</strong> Evaluated Total Availability is exactly 100 Marks (50 Marks ICA + 50 Marks TEE). Ready to register into your active semester curriculum.
          </span>
        </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Check size={16} /> Confirm & Ingest Course
          </button>
        </div>
      </div>
    </div>
  );
};
