import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { colors, spacing } from "@/theme/colors";
import { PostCard } from "@/components/community/PostCard";
import { SponsoredBrokerCard } from "@/components/common/SponsoredCard";
import { useCommunityPosts } from "@/api/hooks";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/authStore";

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const postsQuery = useCommunityPosts({}, token);
  const [draft, setDraft] = useState("");
  const [symbolDraft, setSymbolDraft] = useState("");
  const [posting, setPosting] = useState(false);

  async function handlePost() {
    if (!token || !draft.trim()) return;
    setPosting(true);
    try {
      await api.community.createPost(token, draft.trim(), symbolDraft.trim() || undefined);
      setDraft("");
      setSymbolDraft("");
      await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    } finally {
      setPosting(false);
    }
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
      <Text style={styles.title}>{t("tabs.community")}</Text>

      <View style={styles.composer}>
        {token ? (
          <>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("community.composerPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.composerInput}
              multiline
            />
            <View style={styles.composerRow}>
              <TextInput
                value={symbolDraft}
                onChangeText={setSymbolDraft}
                placeholder={t("community.symbolOptional")}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={styles.symbolInput}
              />
              <Pressable
                onPress={handlePost}
                disabled={posting || !draft.trim()}
                style={[styles.postButton, (posting || !draft.trim()) && styles.postButtonDisabled]}
              >
                <Text style={styles.postButtonText}>{t("community.post")}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => router.push("/auth")} style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>{t("community.loginToPost")}</Text>
          </Pressable>
        )}
      </View>

      {postsQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={postsQuery.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<SponsoredBrokerCard />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(`/community/post/${item.id}`)}
              onPressAuthor={() => router.push(`/community/profile/${item.author.id}`)}
              onToggleLike={() => handleToggleLike(item.id, item.likedByMe)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t("community.noPosts")}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  composer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  composerInput: {
    color: colors.textPrimary,
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: "top",
  },
  composerRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  symbolInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 12,
  },
  postButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: colors.black, fontSize: 12, fontWeight: "800" },
  loginPrompt: { alignItems: "center", paddingVertical: spacing.xs },
  loginPromptText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  list: { padding: spacing.lg },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
