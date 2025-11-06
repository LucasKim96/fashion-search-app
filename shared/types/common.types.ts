export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  details?: any; // thêm để đọc được error details nếu BE trả về
}
