import { apiSlice } from "./apiSlice";

/**
 * FacePass API Endpoints (1:1 parity with facepass-web/app/lib/api/facepassApi.jsx)
 * Powered by RTK Query with automatic token refresh & cache invalidation.
 */
export const facepassApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ════════════════════════════════════════════════════════════════════════
    // AUTHENTICATION & PASSWORD SECURITY
    // ════════════════════════════════════════════════════════════════════════
    changePassword: builder.mutation({
      query: (body: { current_password: string; new_password: string }) => ({
        url: "auth/change-password",
        method: "POST",
        body,
      }),
    }),

    // ════════════════════════════════════════════════════════════════════════
    // SUPER ADMIN GOVERNANCE ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════
    getAdminStats: builder.query<any, void>({
      query: () => "admin/stats",
      providesTags: ["AdminStats"],
    }),

    getAdminUsers: builder.query<any, string | void>({
      query: (role) => (role ? `admin/users?role=${role}` : "admin/users"),
      providesTags: ["AdminUsers"],
    }),

    createLecturerAccount: builder.mutation({
      query: (body: {
        name: string;
        email: string;
        matric?: string;
        password?: string;
        role?: string;
        must_change_password?: boolean;
        send_email?: boolean;
      }) => ({
        url: "admin/lecturers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    resetUserPassword: builder.mutation({
      query: ({
        userId,
        ...body
      }: {
        userId: string;
        password?: string;
        send_email?: boolean;
      }) => ({
        url: `admin/users/${userId}/reset-password`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    assignUserRole: builder.mutation({
      query: (body: { user_id: string; role: string }) => ({
        url: "admin/assign-role",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    deleteAdminUser: builder.mutation({
      query: (userId: string) => ({
        url: `admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    getAdminSessions: builder.query<any, void>({
      query: () => "admin/sessions",
      providesTags: ["AdminSessions"],
    }),

    assignLecturerToSession: builder.mutation({
      query: ({
        sessionId,
        lecturer_id,
      }: {
        sessionId: string;
        lecturer_id: string;
      }) => ({
        url: `admin/sessions/${sessionId}/assign-lecturer`,
        method: "POST",
        body: { lecturer_id },
      }),
      invalidatesTags: ["AdminSessions", "LecturerSessions", "SessionDetail"],
    }),

    removeLecturerFromSession: builder.mutation({
      query: ({
        sessionId,
        lecturerId,
      }: {
        sessionId: string;
        lecturerId: string;
      }) => ({
        url: `admin/sessions/${sessionId}/remove-lecturer/${lecturerId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminSessions", "LecturerSessions", "SessionDetail"],
    }),

    deleteAdminSession: builder.mutation({
      query: (sessionId: string) => ({
        url: `admin/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminSessions", "LecturerSessions", "AdminStats"],
    }),

    // ════════════════════════════════════════════════════════════════════════
    // LECTURER WORKSPACE & BIOMETRIC COMMAND CENTER ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════
    getAllCourses: builder.query<any, void>({
      query: () => "courses",
      providesTags: ["Courses"],
    }),

    createCourse: builder.mutation({
      query: (body: {
        courseID: string;
        courseName: string;
        description?: string;
      }) => ({
        url: "lecturer/course",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Courses", "AdminStats"],
    }),

    getLecturerSessions: builder.query<any, void>({
      query: () => "lecturer/sessions",
      providesTags: ["LecturerSessions"],
    }),

    createCourseSession: builder.mutation({
      query: (body: {
        courseID: string;
        session_name: string;
        total_expected_classes: number;
        timetable?: any[];
      }) => ({
        url: "lecturer/session",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LecturerSessions", "AdminSessions", "AdminStats"],
    }),

    getSessionDetail: builder.query<any, string>({
      query: (sessionId) => `lecturer/sessions/${sessionId}`,
      providesTags: (result, error, sessionId) => [
        { type: "SessionDetail", id: sessionId },
      ],
    }),

    updateCourseSession: builder.mutation({
      query: ({
        sessionId,
        ...body
      }: {
        sessionId: string;
        total_expected_classes?: number;
        session_name?: string;
        timetable?: any[];
      }) => ({
        url: `lecturer/sessions/${sessionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDetail", id: sessionId },
        "LecturerSessions",
        "AdminSessions",
      ],
    }),

    addCoLecturer: builder.mutation({
      query: ({
        sessionId,
        email,
      }: {
        sessionId: string;
        email: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/co-lecturers`,
        method: "POST",
        body: { email },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDetail", id: sessionId },
        "LecturerSessions",
        "AdminSessions",
      ],
    }),

    getAttendancePresignedUrl: builder.query<
      { presigned_url: string; s3_key: string },
      { sessionId: string; fileName: string; fileType: string }
    >({
      query: ({ sessionId, fileName, fileType }) =>
        `lecturer/sessions/${sessionId}/attendance/presigned-url?file_name=${encodeURIComponent(
          fileName
        )}&file_type=${encodeURIComponent(fileType)}`,
    }),

    processImageAttendance: builder.mutation({
      query: ({
        sessionId,
        s3_key,
      }: {
        sessionId: string;
        s3_key: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/attendance/image`,
        method: "POST",
        body: { s3_key },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDetail", id: sessionId },
        "AdminStats",
      ],
    }),

    processVideoAttendance: builder.mutation({
      query: ({
        sessionId,
        s3_key,
      }: {
        sessionId: string;
        s3_key: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/attendance/video`,
        method: "POST",
        body: { s3_key },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDetail", id: sessionId },
        "AdminStats",
      ],
    }),

    getImageAttendanceStatus: builder.query<
      any,
      { sessionId: string; jobId: string }
    >({
      query: ({ sessionId, jobId }) =>
        `lecturer/sessions/${sessionId}/attendance/image-status/${jobId}`,
    }),

    getVideoAttendanceStatus: builder.query<
      any,
      { sessionId: string; jobId: string }
    >({
      query: ({ sessionId, jobId }) =>
        `lecturer/sessions/${sessionId}/attendance/video-status/${jobId}`,
    }),

    overrideAttendanceLog: builder.mutation({
      query: ({
        sessionId,
        logId,
        status,
      }: {
        sessionId: string;
        logId: string;
        status: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/attendance-log/${logId}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionDetail", id: sessionId },
        "StudentAudit",
      ],
    }),

    getStudentAudit: builder.query<
      any,
      { sessionId: string; studentId: string }
    >({
      query: ({ sessionId, studentId }) =>
        `lecturer/sessions/${sessionId}/student-audit/${studentId}`,
      providesTags: ["StudentAudit"],
    }),

    // ════════════════════════════════════════════════════════════════════════
    // COURSE MATERIALS & QUIZZES (COURSEPASS SYNC)
    // ════════════════════════════════════════════════════════════════════════
    getSessionMaterials: builder.query<any, string>({
      query: (sessionId) => `lecturer/sessions/${sessionId}/materials`,
      providesTags: (result, error, sessionId) => [
        { type: "SessionMaterials", id: sessionId },
      ],
    }),

    createSessionMaterial: builder.mutation({
      query: ({
        sessionId,
        ...body
      }: {
        sessionId: string;
        title: string;
        type: string;
        file_url: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/materials`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionMaterials", id: sessionId },
      ],
    }),

    deleteSessionMaterial: builder.mutation({
      query: ({
        sessionId,
        materialId,
      }: {
        sessionId: string;
        materialId: string;
      }) => ({
        url: `lecturer/sessions/${sessionId}/materials/${materialId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionMaterials", id: sessionId },
      ],
    }),

    getSessionQuizzes: builder.query<any, string>({
      query: (sessionId) => `lecturer/sessions/${sessionId}/quizzes`,
      providesTags: (result, error, sessionId) => [
        { type: "SessionQuizzes", id: sessionId },
      ],
    }),

    createSessionQuiz: builder.mutation({
      query: ({
        sessionId,
        ...body
      }: {
        sessionId: string;
        [key: string]: any;
      }) => ({
        url: `lecturer/sessions/${sessionId}/quizzes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionQuizzes", id: sessionId },
      ],
    }),

    getQuizAnalytics: builder.query<
      any,
      { sessionId: string; quizId: string }
    >({
      query: ({ sessionId, quizId }) =>
        `lecturer/sessions/${sessionId}/quizzes/${quizId}/analytics`,
    }),

    // ════════════════════════════════════════════════════════════════════════
    // COURSE TIMETABLE & LECTURE UPDATE PUSH NOTIFICATIONS
    // ════════════════════════════════════════════════════════════════════════
    getSessionTimetable: builder.query<any, string>({
      query: (sessionId) => `lecturer/sessions/${sessionId}/timetable`,
      providesTags: (result, error, sessionId) => [
        { type: "SessionTimetable", id: sessionId },
      ],
    }),

    saveSessionTimetable: builder.mutation({
      query: ({
        sessionId,
        ...body
      }: {
        sessionId: string;
        timetable: any[];
        notify_mobile?: boolean;
      }) => ({
        url: `lecturer/sessions/${sessionId}/timetable`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "SessionTimetable", id: sessionId },
        { type: "SessionDetail", id: sessionId },
        "LecturerSessions",
      ],
    }),

    pushLectureNotification: builder.mutation({
      query: ({
        sessionId,
        ...body
      }: {
        sessionId: string;
        title?: string;
        message: string;
        update_type?: string;
        slot?: any;
      }) => ({
        url: `lecturer/sessions/${sessionId}/notify`,
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useChangePasswordMutation,
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useCreateLecturerAccountMutation,
  useResetUserPasswordMutation,
  useAssignUserRoleMutation,
  useDeleteAdminUserMutation,
  useGetAdminSessionsQuery,
  useAssignLecturerToSessionMutation,
  useRemoveLecturerFromSessionMutation,
  useDeleteAdminSessionMutation,
  useGetAllCoursesQuery,
  useCreateCourseMutation,
  useGetLecturerSessionsQuery,
  useCreateCourseSessionMutation,
  useGetSessionDetailQuery,
  useUpdateCourseSessionMutation,
  useAddCoLecturerMutation,
  useLazyGetAttendancePresignedUrlQuery,
  useProcessImageAttendanceMutation,
  useProcessVideoAttendanceMutation,
  useLazyGetVideoAttendanceStatusQuery,
  useLazyGetImageAttendanceStatusQuery,
  useOverrideAttendanceLogMutation,
  useGetStudentAuditQuery,
  useGetSessionMaterialsQuery,
  useCreateSessionMaterialMutation,
  useDeleteSessionMaterialMutation,
  useGetSessionQuizzesQuery,
  useCreateSessionQuizMutation,
  useGetQuizAnalyticsQuery,
  useGetSessionTimetableQuery,
  useSaveSessionTimetableMutation,
  usePushLectureNotificationMutation,
} = facepassApi;
