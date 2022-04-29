#!/bin/bash

VARIANT="outlined" # filled outlined round sharp two-tone
OUT="src/com.genericmale.sonos.sdPlugin/images"

ACTION_COLOR="#d8d8d8"
ACTION_SIZE=20

KEY_COLOR="#000000"
KEY_BGCOLOR="#d8a158"
KEY_SIZE=72
KEY_ICON_SIZE=40
KEY_RADIUS=14

CATEGORY_COLOR="#c8c8c8"
CATEGORY_SIZE=28

SRC="material-design-icons/svg/$VARIANT"

mask () {
	KEY_SIZE_2=$((KEY_SIZE * 2))
	KEY_RADIUS_2=$((KEY_RADIUS * 2))
	convert -size ${KEY_SIZE}x${KEY_SIZE} xc:none -draw "roundrectangle 0,0,$KEY_SIZE,$KEY_SIZE,$KEY_RADIUS,$KEY_RADIUS" "mask_$KEY_SIZE.png"
	convert -size ${KEY_SIZE_2}x${KEY_SIZE_2} xc:none -draw "roundrectangle 0,0,$KEY_SIZE_2,$KEY_SIZE_2,$KEY_RADIUS_2,$KEY_RADIUS_2" "mask_$KEY_SIZE_2.png"
}

delmask () {
	rm mask_$KEY_SIZE.png mask_$((KEY_SIZE * 2)).png
}

action () {
	convert -density 1200 -background none -fill "$ACTION_COLOR" -opaque black -resize ${ACTION_SIZE}x${ACTION_SIZE} $SRC/$1.svg $OUT/$2_action.png
	convert -density 1200 -background none -fill "$ACTION_COLOR" -opaque black -resize $((ACTION_SIZE * 2))x$((ACTION_SIZE * 2)) $SRC/$1.svg $OUT/$2_action@2x.png
}

category () {
	convert -density 1200 -background none -fill "$CATEGORY_COLOR" -opaque black -resize ${CATEGORY_SIZE}x${CATEGORY_SIZE} $SRC/$1.svg $OUT/plugin_category.png
	convert -density 1200 -background none -fill "$CATEGORY_COLOR" -opaque black -resize $((CATEGORY_SIZE * 2))x$((CATEGORY_SIZE * 2)) $SRC/$1.svg $OUT/plugin_category@2x.png
}

generateKeyIcon () {
	ICON=$1;
	TARGET="$OUT/$2.png";
	SCALE=$3
	SIZE=$((KEY_SIZE * SCALE))
	ICON_SIZE=$((KEY_ICON_SIZE * SCALE))
	convert -density 1200 -background "$KEY_BGCOLOR" -fill "$KEY_COLOR" -opaque black -resize ${ICON_SIZE}x${ICON_SIZE} -gravity Center -extent ${SIZE}x${SIZE} $SRC/$ICON.svg $TARGET
	convert $TARGET -matte "mask_$SIZE.png" -compose DstIn -composite $TARGET
}

key () {
	generateKeyIcon $1 $2_key 1
	generateKeyIcon $1 $2_key@2x 2
}

mkdir -p $OUT
mask

action volume_off mute
key volume_off muted
key volume_up unmuted

action skip_next next
key skip_next next

action settings_input_component changesource
key settings_input_component changesource

action airplay playuri
key airplay playuri

action play_arrow playpause
key play_arrow paused
key play_circle_filled playing

action skip_previous previous
key skip_previous previous

action playlist_play playfavorites
key playlist_play playfavorites

action repeat repeat
key repeat repeat_none
key repeat_on repeat_all
key repeat_one_on repeat_one

action shuffle shuffle
key shuffle shuffle_off
key shuffle_on shuffle_on

action volume_up volume
key volume_up volume

action volume_down volumedown
key volume_down volumedown

action volume_up volumeup
key volume_up volumeup

category speaker
delmask
