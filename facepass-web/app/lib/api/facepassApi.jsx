// RTK Query API slice for FacePass lecturer, student & admin endpoints
import { baseApi } from "./apiSlice";

export const facepassApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Auth / Security Endpoints ──────────────────────────────
    changePassword: builder.mutation({
      query: (body) => ({
        url: "auth/change-password",
        method: "POST",
        body,
      }),
    }),

    // ─── Lecturer Endpoints ─────────────────────────────────────
    lecturerCreateCourse: builder.mutation({
      query: (body) => ({ url: "lecturer/course", method: "POST", body }),
      invalidatesTags: [
        "LecturerSessions",
        "LecturerCourses",
        "AdminCourses",
        "AdminOverview",
      ],
    }),
    lecturerCreateSession: builder.mutation({
      query: (body) => ({ url: "lecturer/session", method: "POST", body }),
      invalidatesTags: [
        "LecturerSessions",
        "AdminSessions",
        "AdminCourses",
        "AdminOverview",
      ],
    }),
    getLecturerSessions: builder.query({
      query: () => "lecturer/sessions",
      providesTags: ["LecturerSessions"],
    }),
    getLecturerCourses: builder.query({
      query: () => "lecturer/courses",
      providesTags: ["LecturerCourses"],
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
      invalidatesTags: ["AdminSessions", "AdminUsers"],
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
      invalidatesTags: ["LecturerSessions", "AdminSessions"],
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

    // ─── Attendance Endpoints ───────────────────────────────────
    uploadAttendanceVideo: builder.mutation({
      query: ({ sessionId, formData }) => ({
        url: `lecturer/sessions/${sessionId}/attendance/video`,
        method: "POST",
        body: formData,
      }),
    }),
    checkVideoStatus: builder.query({
      query: ({ sessionId, jobId }) =>
        `lecturer/sessions/${sessionId}/attendance/video-status/${jobId}`,
    }),
    takeAttendanceImage: builder.mutation({
      query: ({ sessionId, formData }) => ({
        url: `lecturer/sessions/${sessionId}/attendance/image`,
        method: "POST",
        body: formData,
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

    // ─── Admin Command Center Endpoints ─────────────────────────
    getAdminOverview: builder.query({
      query: () => "admin/overview",
      providesTags: ["AdminOverview"],
    }),
    getAdminUsers: builder.query({
      query: (params) => {
        if (!params) return "admin/users";
        if (typeof params === "string") {
          return `admin/users${params ? `?role=${params}` : ""}`;
        }
        const searchParams = new URLSearchParams();
        if (params.role && params.role !== "ALL") {
          searchParams.set("role", params.role);
        }
        if (params.q) {
          searchParams.set("q", params.q);
        }
        const qs = searchParams.toString();
        return `admin/users${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AdminUsers"],
    }),
    adminCreateLecturer: builder.mutation({
      query: (body) => ({
        url: "admin/lecturers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers", "AdminOverview"],
    }),
    adminResetUserPassword: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `admin/users/${userId}/reset-password`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers", "AdminOverview"],
    }),
    assignRole: builder.mutation({
      query: (body) => ({ url: "admin/assign-role", method: "POST", body }),
      invalidatesTags: ["AdminUsers", "AdminOverview"],
    }),
    adminDeleteUser: builder.mutation({
      query: (userId) => ({
        url: `admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUsers", "AdminOverview", "AdminSessions"],
    }),
    getAdminCourses: builder.query({
      query: () => "admin/courses",
      providesTags: ["AdminCourses"],
    }),
    adminDeleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `admin/courses/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminCourses", "AdminOverview", "LecturerCourses"],
    }),
    getAdminSessions: builder.query({
      query: () => "admin/sessions",
      providesTags: ["AdminSessions"],
    }),
    adminDeleteSession: builder.mutation({
      query: (sessionId) => ({
        url: `admin/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "AdminSessions",
        "AdminCourses",
        "AdminOverview",
        "LecturerSessions",
      ],
    }),
    adminAssignLecturerToSession: builder.mutation({
      query: ({ sessionId, ...body }) => ({
        url: `admin/sessions/${sessionId}/assign-lecturer`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminSessions", "AdminUsers", "LecturerSessions"],
    }),
    adminRemoveLecturerFromSession: builder.mutation({
      query: ({ sessionId, lecturerId }) => ({
        url: `admin/sessions/${sessionId}/lecturers/${lecturerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminSessions", "AdminUsers", "LecturerSessions"],
    }),
  }),
});

export const {
  // Auth / Security
  useChangePasswordMutation,
  // Lecturer
  useLecturerCreateCourseMutation,
  useLecturerCreateSessionMutation,
  useGetLecturerSessionsQuery,
  useGetLecturerCoursesQuery,
  useGetSessionDashboardQuery,
  useGetSessionHistoryQuery,
  useAddCoLecturerMutation,
  useGetCoLecturersQuery,
  useUpdateSessionMutation,
  useManualOverrideMutation,
  // Attendance
  useUploadAttendanceVideoMutation,
  useCheckVideoStatusQuery,
  useTakeAttendanceImageMutation,
  // Student
  useStudentEnrollMutation,
  useGetStudentSessionsQuery,
  useGetStudentAttendanceQuery,
  useGetAvailableSessionsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  // Admin
  useGetAdminOverviewQuery,
  useGetAdminUsersQuery,
  useAdminCreateLecturerMutation,
  useAdminResetUserPasswordMutation,
  useAssignRoleMutation,
  useAdminDeleteUserMutation,
  useGetAdminCoursesQuery,
  useAdminDeleteCourseMutation,
  useGetAdminSessionsQuery,
  useAdminDeleteSessionMutation,
  useAdminAssignLecturerToSessionMutation,
  useAdminRemoveLecturerFromSessionMutation,
} = facepassApi;
