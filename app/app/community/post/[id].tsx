import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { colors, spacing } from "@/theme/colors";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityComments, useCommunityPosts } from "@/api/hooks";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime } from "@/utils/time";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  // The feed query cache doubles as our single-post source, since there is
  // no dedicated GET /posts/:id endpoint — keeping the API surface small.
  const postsQuery = useCommunityPosts({}, token);
  const post = postsQuery.data?.find((p) => p.id === postId);

  const commentsQuery = useCommunityComments(postId);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleToggleLike() {
    if (!post) return;
    if (!token) {
      router.push("/auth");
      return;
    }
    await (post.likedByMe ? api.community.unlike(token, postId) : api.community.like(token, postId));
    await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  }

  async function handleSubmitComment() {
    if (!token) {
      router.push("/auth");
      return;
    }
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await api.community.createComment(token, postId, draft.trim());
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["community-comments", postId] });
      await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t("community.post") }} />

      {post ? (
        <PostCard
          post={post}
          onPress={() => {}}
          onPressAuthor={() => router.push(`/community/profile/${post.author.id}`)}
          onToggleLike={handleToggleLike}
        />
      ) : postsQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}

      <Text style={styles.sectionTitle}>{t("community.comments")}</Text>

      {commentsQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        (commentsQuery.data ?? []).map((comment) => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>
                {comment.author.displayName || comment.author.email}
              </Text>
              <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentBody}>{comment.body}</Text>
          </View>
        ))
      )}
      {commentsQuery.data?.length === 0 && (
        <Text style={styles.empty}>{t("community.noComments")}</Text>
      )}

      <View style={styles.composer}>
        {token ? (
          <>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("community.commentPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.commentInput}
              multiline
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={submitting || !draft.trim()}
              style={[styles.submitButton, (submitting || !draft.trim()) && styles.submitButtonDisabled]}
            >
              <Text style={styles.submitButtonText}>{t("community.reply")}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => router.push("/auth")} style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>{t("community.loginToInteract")}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  loader: { marginVertical: spacing.xl },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  commentTime: { color: colors.textMuted, fontSize: 11 },
  commentBody: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  empty: { color: colors.textMuted, textAlign: "center", marginVertical: spacing.md },
  composer: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  commentInput: { color: colors.textPrimary, fontSize: 13, minHeight: 40, textAlignVertical: "top" },
  submitButton: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.black, fontSize: 12, fontWeight: "800" },
  loginPrompt: { alignItems: "center", paddingVertical: spacing.xs },
  loginPromptText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
});
