import { swaggerSpec } from '@/utils/const';
import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger(swaggerSpec);
export default swaggerHandler();