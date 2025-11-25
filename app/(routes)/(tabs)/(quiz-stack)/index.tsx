import { HeaderContent } from '@/src/components';
import { TakeQuizScreen } from '@/src/screens';

const HistoryPage = () => (
  <>
    <HeaderContent />
    <TakeQuizScreen navigation={{
      navigate: function (screen: string, params?: object): void {
        throw new Error('Function not implemented.');
      }
    }} />
  </>
);

export default HistoryPage;
