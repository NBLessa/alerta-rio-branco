import { Header } from '@/components/Header';
import { ReportWizard } from '@/components/ReportWizard';

const Report = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ReportWizard />
    </div>
  );
};

export default Report;
