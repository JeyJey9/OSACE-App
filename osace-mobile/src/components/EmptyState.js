import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { 
  Circle, Rect, Path, G, Line, Ellipse, Polygon, Polyline, Defs, ClipPath
} from 'react-native-svg';
import { useThemeColor } from '../constants/useThemeColor';

// ─── Individual Illustration Components ────────────────────────────────────────

function NoEventsIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Calendar body */}
      <Rect x="15" y="20" width="110" height="85" rx="10" fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Calendar top bar */}
      <Rect x="15" y="20" width="110" height="25" rx="10" fill={primary} opacity="0.15" />
      <Rect x="15" y="35" width="110" height="10" fill={primary} opacity="0.15" />
      {/* Ring bolts */}
      <Rect x="42" y="13" width="8" height="18" rx="4" fill={primary} opacity="0.6" />
      <Rect x="90" y="13" width="8" height="18" rx="4" fill={primary} opacity="0.6" />
      {/* Grid dots */}
      {[0,1,2,3].map(col => [0,1,2].map(row => (
        <Circle key={`${col}-${row}`} cx={36 + col*23} cy={58 + row*18} r="3.5" fill={muted} opacity="0.4" />
      )))}
      {/* Star center-right */}
      <G transform="translate(95, 55)">
        <Path d="M0,-12 L2.8,-4.5 L10.5,-4.5 L4.5,0.5 L7,8.5 L0,4 L-7,8.5 L-4.5,0.5 L-10.5,-4.5 L-2.8,-4.5 Z" 
          fill={primary} opacity="0.8" />
      </G>
    </Svg>
  );
}

function NoRegisteredIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Person body */}
      <Circle cx="55" cy="38" r="18" fill={bg} stroke={muted} strokeWidth="2.5" />
      <Ellipse cx="55" cy="88" rx="28" ry="20" fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Clipboard */}
      <Rect x="78" y="30" width="46" height="58" rx="6" fill={bg} stroke={muted} strokeWidth="2" />
      <Rect x="88" y="24" width="26" height="10" rx="4" fill={muted} opacity="0.5" />
      {/* Lines on clipboard */}
      <Line x1="86" y1="50" x2="116" y2="50" stroke={muted} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <Line x1="86" y1="62" x2="116" y2="62" stroke={muted} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <Line x1="86" y1="74" x2="104" y2="74" stroke={muted} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* Check mark */}
      <Circle cx="115" cy="85" r="14" fill={primary} opacity="0.15" />
      <Path d="M108,85 L113,91 L122,79" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function NoHistoryIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Hourglass outer shape */}
      <Path d="M40,15 L100,15 L100,25 Q70,60 70,60 Q100,95 100,105 L40,105 Q40,95 70,60 Q40,25 40,25 Z" 
        fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Top sand */}
      <Path d="M45,25 Q70,45 70,55 Q55,47 45,30 Z" fill={primary} opacity="0.3" />
      {/* Bottom sand */}
      <Ellipse cx="70" cy="96" rx="18" ry="8" fill={primary} opacity="0.4" />
      {/* Hourglass caps */}
      <Rect x="35" y="10" width="70" height="10" rx="4" fill={muted} opacity="0.5" />
      <Rect x="35" y="100" width="70" height="10" rx="4" fill={muted} opacity="0.5" />
      {/* Center dot */}
      <Circle cx="70" cy="60" r="4" fill={primary} opacity="0.7" />
    </Svg>
  );
}

function NoFeedIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Megaphone body */}
      <Path d="M30,45 L30,75 L55,75 L95,95 L95,25 L55,45 Z" 
        fill={bg} stroke={muted} strokeWidth="2.5" strokeLinejoin="round" />
      {/* Sound waves */}
      <Path d="M103,40 Q115,60 103,80" stroke={primary} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      <Path d="M110,32 Q128,60 110,88" stroke={primary} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.25" />
      {/* Handle */}
      <Rect x="30" y="75" width="20" height="20" rx="4" fill={muted} opacity="0.5" />
      {/* Decorative star */}
      <Circle cx="20" cy="30" r="5" fill={primary} opacity="0.3" />
      <Circle cx="125" cy="105" r="4" fill={primary} opacity="0.2" />
    </Svg>
  );
}

function NoLeaderboardIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Trophy cup */}
      <Path d="M50,25 L90,25 L85,70 Q70,82 55,70 Z" fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Trophy base */}
      <Rect x="58" y="70" width="24" height="10" rx="2" fill={muted} opacity="0.5" />
      <Rect x="50" y="80" width="40" height="8" rx="4" fill={muted} opacity="0.5" />
      {/* Handles */}
      <Path d="M50,32 Q32,32 32,48 Q32,60 50,60" stroke={muted} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M90,32 Q108,32 108,48 Q108,60 90,60" stroke={muted} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Question mark inside */}
      <Text x="65" y="60" fontSize="28" fontWeight="bold" fill={primary} fillOpacity="0.5">?</Text>
    </Svg>
  );
}

function NoNotificationsIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Bell shape */}
      <Path d="M70,18 Q48,18 44,50 L38,80 L102,80 L96,50 Q92,18 70,18 Z" 
        fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Bell bottom arc */}
      <Path d="M38,80 L102,80" stroke={muted} strokeWidth="2.5" strokeLinecap="round" />
      {/* Bell clapper */}
      <Ellipse cx="70" cy="88" rx="10" ry="6" fill={muted} opacity="0.4" />
      {/* Bell top dot */}
      <Circle cx="70" cy="16" r="5" fill={muted} opacity="0.5" />
      {/* ZZZ letters */}
      <Text x="95" y="38" fontSize="13" fontWeight="bold" fill={primary} fillOpacity="0.6">z</Text>
      <Text x="103" y="28" fontSize="16" fontWeight="bold" fill={primary} fillOpacity="0.45">z</Text>
      <Text x="113" y="16" fontSize="19" fontWeight="bold" fill={primary} fillOpacity="0.3">z</Text>
    </Svg>
  );
}

function NoBadgesIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Ribbon shield */}
      <Path d="M70,15 L100,30 L100,65 Q100,90 70,105 Q40,90 40,65 L40,30 Z" 
        fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Inner shield */}
      <Path d="M70,28 L88,38 L88,62 Q88,78 70,88 Q52,78 52,62 L52,38 Z" 
        fill={primary} fillOpacity="0.08" stroke={primary} strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Lock body */}
      <Rect x="58" y="55" width="24" height="20" rx="4" fill={muted} opacity="0.5" />
      {/* Lock shackle */}
      <Path d="M63,55 L63,47 Q63,38 70,38 Q77,38 77,47 L77,55" 
        stroke={muted} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Lock keyhole */}
      <Circle cx="70" cy="63" r="4" fill={bg} />
      <Rect x="68" y="64" width="4" height="6" rx="1" fill={bg} />
    </Svg>
  );
}

function NoRequestsIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Inbox tray */}
      <Path d="M20,50 L20,95 Q20,105 30,105 L110,105 Q120,105 120,95 L120,50 Z" 
        fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Inbox slot */}
      <Path d="M20,70 L40,70 Q45,85 70,85 Q95,85 100,70 L120,70" 
        stroke={muted} strokeWidth="2.5" fill="none" />
      {/* Big checkmark circle */}
      <Circle cx="70" cy="45" r="28" fill={primary} fillOpacity="0.1" stroke={primary} strokeWidth="2" strokeOpacity="0.4" />
      <Path d="M57,45 L65,54 L83,35" stroke={primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Decorative dots */}
      <Circle cx="30" cy="30" r="4" fill={primary} opacity="0.2" />
      <Circle cx="110" cy="25" r="3" fill={primary} opacity="0.15" />
    </Svg>
  );
}

function NoParticipantsIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Center person */}
      <Circle cx="70" cy="38" r="16" fill={bg} stroke={muted} strokeWidth="2.5" />
      <Ellipse cx="70" cy="82" rx="22" ry="14" fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Left person (faded) */}
      <Circle cx="30" cy="44" r="12" fill={bg} stroke={muted} strokeWidth="2" opacity="0.5" />
      <Ellipse cx="30" cy="80" rx="16" ry="11" fill={bg} stroke={muted} strokeWidth="2" opacity="0.5" />
      {/* Right person (faded) */}
      <Circle cx="110" cy="44" r="12" fill={bg} stroke={muted} strokeWidth="2" opacity="0.5" />
      <Ellipse cx="110" cy="80" rx="16" ry="11" fill={bg} stroke={muted} strokeWidth="2" opacity="0.5" />
      {/* Plus sign center */}
      <Circle cx="70" cy="38" r="8" fill={primary} opacity="0.2" />
      <Line x1="66" y1="38" x2="74" y2="38" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="70" y1="34" x2="70" y2="42" stroke={primary} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function NoUsersIllustration({ primary, muted, bg }) {
  return (
    <Svg width="140" height="120" viewBox="0 0 140 120">
      {/* Person */}
      <Circle cx="55" cy="40" r="18" fill={bg} stroke={muted} strokeWidth="2.5" />
      <Ellipse cx="55" cy="88" rx="28" ry="18" fill={bg} stroke={muted} strokeWidth="2.5" />
      {/* Magnifying glass */}
      <Circle cx="98" cy="52" r="22" fill={bg} stroke={muted} strokeWidth="2.5" />
      <Circle cx="98" cy="52" r="14" fill={primary} opacity="0.08" />
      <Line x1="114" y1="68" x2="126" y2="80" stroke={muted} strokeWidth="4" strokeLinecap="round" />
      {/* Question in magnifier */}
      <Text x="90" y="60" fontSize="18" fontWeight="bold" fill={primary} fillOpacity="0.5">?</Text>
    </Svg>
  );
}

// ─── Illustration Map ───────────────────────────────────────────────────────────

const ILLUSTRATIONS = {
  no_events: NoEventsIllustration,
  no_registered: NoRegisteredIllustration,
  no_history: NoHistoryIllustration,
  no_feed: NoFeedIllustration,
  no_leaderboard: NoLeaderboardIllustration,
  no_notifications: NoNotificationsIllustration,
  no_badges: NoBadgesIllustration,
  no_requests: NoRequestsIllustration,
  no_participants: NoParticipantsIllustration,
  no_users: NoUsersIllustration,
};

// ─── Main EmptyState Component ─────────────────────────────────────────────────

export default function EmptyState({ 
  illustration = 'no_events', 
  title, 
  subtitle, 
  action 
}) {
  const { colors, isDark } = useThemeColor();

  const IllustrationComponent = ILLUSTRATIONS[illustration] || NoEventsIllustration;

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <View style={styles.illustrationWrapper}>
        <IllustrationComponent 
          primary={colors.primary} 
          muted={isDark ? '#4a5568' : '#cbd5e0'}
          bg={isDark ? colors.card : '#f7fafc'}
        />
      </View>
      
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      {action && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  illustrationWrapper: {
    marginBottom: 24,
    opacity: isDark ? 0.9 : 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
