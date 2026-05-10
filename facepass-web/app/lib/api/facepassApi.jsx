// RTK Query API slice for FacePass lecturer & student endpoints
import { baseApi } from "./apiSlice";

export const facepassApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Lecturer Endpoints ─────────────────────────────────────
    lecturerCreateCourse: builder.mutation({
      query: (body) => ({ url: "lecturer/course", method: "POST", body }),
      invalidatesTags: ["LecturerSessions"],
    }),
    lecturerCreateSession: builder.mutation({
      query: (body) => ({ url: "lecturer/session", method: "POST", body }),
      invalidatesTags: ["LecturerSessions"],
    }),
    getLecturerSessions: builder.query({
      query: () => "lecturer/sessions",
      providesTags: ["LecturerSessions"],
    }),
    getSessionDashboard: builder.query({
      query: (sessionId) => `lecturer/sessions/${sessionId}/dashboard`,
      providesTags: (result, error, id) => [{ type: "SessionDashboard", id }],
    }),
    getSessionHistory: builder.query({
      query: (sessionId) => `lecturer/sessions/${sessionId}/history`,
      providesTags: (result, error, id) => [{ type: "SessionHistory", id }],
    }),
    addCoLecturer: builder.mutation({
      query: ({ sessionId, ...body }) => ({
        url: `lecturer/sessions/${sessionId}/co-lecturers`,
        method: "POST",
        body,
      }),
    }),
    getCoLecturers: builder.query({
      query: (sessionId) => `lecturer/sessions/${sessionId}/co-lecturers`,
    }),
    updateSession: builder.mutation({
      query: ({ sessionId, ...body }) => ({
        url: `lecturer/sessions/${sessionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LecturerSessions"],
    }),
    manualOverride: builder.mutation({
      query: ({ sessionId, logId, ...body }) => ({
        url: `lecturer/sessions/${sessionId}/attendance-log/${logId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDashboard", id: sessionId },
        { type: "SessionHistory", id: sessionId },
      ],
    }),

    // ─── Student Endpoints ──────────────────────────────────────
    studentEnroll: builder.mutation({
      query: (body) => ({ url: "student/enroll", method: "POST", body }),
      invalidatesTags: ["StudentSessions"],
    }),
    getStudentSessions: builder.query({
      query: () => "student/sessions",
      providesTags: ["StudentSessions"],
    }),
    getStudentAttendance: builder.query({
      query: (sessionId) => `student/sessions/${sessionId}/attendance`,
      providesTags: (result, error, id) => [{ type: "StudentAttendance", id }],
    }),
    getAvailableSessions: builder.query({
      query: (search) =>
        `student/available-sessions${search ? `?search=${search}` : ""}`,
    }),
    getNotifications: builder.query({
      query: () => "student/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `student/notifications/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: "student/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ─── Admin Endpoints ────────────────────────────────────────
    assignRole: builder.mutation({
      query: (body) => ({ url: "admin/assign-role", method: "POST", body }),
    }),
    getAdminUsers: builder.query({
      query: (role) => `admin/users${role ? `?role=${role}` : ""}`,
    }),
  }),
});

export const {
  // Lecturer
  useLecturerCreateCourseMutation,
  useLecturerCreateSessionMutation,
  useGetLecturerSessionsQuery,
  useGetSessionDashboardQuery,
  useGetSessionHistoryQuery,
  useAddCoLecturerMutation,
  useGetCoLecturersQuery,
  useUpdateSessionMutation,
  useManualOverrideMutation,
  // Student
  useStudentEnrollMutation,
  useGetStudentSessionsQuery,
  useGetStudentAttendanceQuery,
  useGetAvailableSessionsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  // Admin
  useAssignRoleMutation,
  useGetAdminUsersQuery,
} = facepassApi;
