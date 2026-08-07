import { useParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Search from '../pages/Search';

export default function SearchRouteWrapper() {
  const { projectId } = useParams();
  console.log('projectId', projectId);
  if (!projectId) return <Navigate to="/projects" replace />;

  return <Search projectId={projectId} />;
}
