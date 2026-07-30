import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { colors, spacing } from "@/theme/colors";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityPosts, useCommunityProfile } from "@/api/hooks";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/authStore";

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const profileQuery = useCommunityProfile(userId, token);
  const postsQuery = useCommunityPosts({ userId }, token);
  const profile = profileQuery.data;

  async function handleToggleFollow() {
    if (!profile) return;
    if (!token) {
      router.push("/auth");
      return;
    }
    await (profile.isFollowedByMe
      ? api.community.unfollow(token, userId)
      : api.community.follow(token, userId));
    await queryClient.invalidateQueries({ queryKey: ["community-profile", userId] });
  }

  async function handleToggleLike(postId: number, likedByMe: boolean) {
    if (!token) {
      router.push("/auth");
      return;
    }
    await (likedByMe ? api.community.unlike(token, postId) : api.community.like(token, postId));
    await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("community.profileTitle") }} />

      {profileQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : profile ? (
        <View style={styles.header}>
          <Text style={styles.name}>{profile.displayName || profile.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.postCount}</Text>
              <Text style={styles.statLabel}>{t("community.posts")}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followerCount}</Text>
              <Text style={styles.statLabel}>{t("community.followers")}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>{t("community.following")}</Text>
            </View>
          </View>
          {currentUserId !== userId && (
            <Pressable
              onPress={handleToggleFollow}
              style={[styles.followButton, profile.isFollowedByMe && styles.followButtonActive]}
            >
              <Text
                style={[
                  styles.followButtonText,
                  profile.isFollowedByMe && styles.followButtonTextActive,
                ]}
              >
                {profile.isFollowedByMe ? t("community.unfollow") : t("community.follow")}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <FlatList
        data={postsQuery.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/community/post/${item.id}`)}
            onPressAuthor={() => {}}
            onToggleLike={() => handleToggleLike(item.id, item.likedByMe)}
          />
        )}
        ListEmptyComponent={
          !postsQuery.isLoading ? <Text style={styles.empty}>{t("community.noPosts")}</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: spacing.xl },
  stat: { alignItems: "center" },
  statValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  statLabel: { color: colors.textSecondary, fontSize: 11 },
  followButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  followButtonActive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: { color: colors.black, fontSize: 12, fontWeight: "800" },
  followButtonTextActive: { color: colors.textPrimary },
  list: { padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
