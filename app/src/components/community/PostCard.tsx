import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius, spacing } from "@/theme/colors";
import type { CommunityPost } from "@/types/api";
import { formatRelativeTime } from "@/utils/time";

export function PostCard({
  post,
  onPress,
  onPressAuthor,
  onToggleLike,
}: {
  post: CommunityPost;
  onPress: () => void;
  onPressAuthor: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable onPress={onPressAuthor} hitSlop={8}>
          <Text style={styles.author}>{post.author.displayName || post.author.email}</Text>
        </Pressable>
        <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
      </View>
      {post.symbol && (
        <View style={styles.symbolChip}>
          <Text style={styles.symbolChipText}>{post.symbol}</Text>
        </View>
      )}
      <Text style={styles.body}>{post.body}</Text>
      <View style={styles.actionsRow}>
        <Pressable onPress={onToggleLike} style={styles.actionButton} hitSlop={8}>
          <Ionicons
            name={post.likedByMe ? "heart" : "heart-outline"}
            size={16}
            color={post.likedByMe ? colors.bearish : colors.textSecondary}
          />
          <Text style={[styles.actionText, post.likedByMe && { color: colors.bearish }]}>
            {post.likeCount}
          </Text>
        </Pressable>
        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.actionText}>
            {post.commentCount} {t("community.comments")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  timestamp: { color: colors.textMuted, fontSize: 11 },
  symbolChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  symbolChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  body: { color: colors.textPrimary, fontSize: 13.5, lineHeight: 19 },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
});
