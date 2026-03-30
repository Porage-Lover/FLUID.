import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { SubjectCard } from '../components/SubjectCard';

export function Marks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const { data } = useData();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Metrics</h1>
      </ScrollHideHeader>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Global Target Grade Predictor */}
        <TargetGradePredictor />

        {/* Subjects List */}
        {data.marks.map((subject, idx) => (
          <SubjectCard key={idx} subject={subject} />
        ))}

      </motion.div>
    </div>
  );
}
