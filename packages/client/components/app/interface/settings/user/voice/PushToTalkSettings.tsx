import { Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import {
  CategoryButton,
  Checkbox,
  Column,
  KeybindInput,
  Row,
  Slider,
  Text,
  TextField,
} from "@revolt/ui";

/**
 * Sync PTT settings to desktop main process
 */
function syncToDesktop(settings: {
  enabled?: boolean;
  keybind?: string;
  mode?: "hold" | "toggle";
  releaseDelay?: number;
}) {
  if (typeof window !== "undefined" && window.pushToTalk?.updateSettings) {
    window.pushToTalk.updateSettings(settings);
  }
}

/**
 * Push to Talk settings configuration
 */
export function PushToTalkSettings() {
  const state = useState();

  return (
    <Column gap="lg">
      <Column>
        <Text class="title" size="small">
          <Trans>Push to Talk</Trans>
        </Text>

        <CategoryButton.Group>
          <CategoryButton
            icon="blank"
            action={
              <div style={{ "pointer-events": "none" }}>
                <Checkbox
                  checked={state.voice.pushToTalkEnabled}
                />
              </div>
            }
            onClick={() => {
              const newValue = !state.voice.pushToTalkEnabled;
              state.voice.pushToTalkEnabled = newValue;
              syncToDesktop({ enabled: newValue });
            }}
          >
            <Trans>Enable Push to Talk</Trans>
          </CategoryButton>
        </CategoryButton.Group>
      </Column>

      <Show when={state.voice.pushToTalkEnabled}>
        <Column gap="md">
          <Text class="label">
            <Trans>Push to Talk Keybind</Trans>
          </Text>
          <KeybindInput
            value={state.voice.pushToTalkKeybind}
            onChange={(value) => {
              state.voice.pushToTalkKeybind = value;
              syncToDesktop({ keybind: value });
            }}
            placeholder="Click to set keybind"
          />
        </Column>

        <Column>
          <Text class="label">
            <Trans>Mode</Trans>
          </Text>
          <CategoryButton.Group>
            <CategoryButton
              icon="blank"
              action={
                <div style={{ "pointer-events": "none" }}>
                  <Checkbox
                    checked={state.voice.pushToTalkMode === "toggle"}
                  />
                </div>
              }
              onClick={() => {
                const newMode = state.voice.pushToTalkMode === "hold" ? "toggle" : "hold";
                state.voice.pushToTalkMode = newMode;
                syncToDesktop({ mode: newMode });
              }}
            >
              <Trans>Enable Toggle Mode</Trans>
            </CategoryButton>
          </CategoryButton.Group>
          <Text class="label" size="small">
            <Trans>Default is Hold mode</Trans>
          </Text>
        </Column>

        <Column gap="md">
          <Text class="label">
            <Trans>Release Delay</Trans>
          </Text>
          <Row gap="md" align="center">
            <SliderContainer>
              <Slider
                min={0}
                max={5000}
                step={50}
                value={state.voice.pushToTalkReleaseDelay}
                onInput={(event) => {
                  const value = event.currentTarget.value;
                  state.voice.pushToTalkReleaseDelay = value;
                  syncToDesktop({ releaseDelay: value });
                }}
                labelFormatter={(value) => `${value}ms`}
              />
            </SliderContainer>
            <TextFieldContainer>
              <TextField
                type="text"
                value={state.voice.pushToTalkReleaseDelay.toString()}
                onChange={(event) => {
                  const value = parseInt(event.currentTarget.value, 10);
                  if (!isNaN(value) && value >= 0 && value <= 5000) {
                    state.voice.pushToTalkReleaseDelay = value;
                    syncToDesktop({ releaseDelay: value });
                  }
                }}
                class={css({
                  width: "80px",
                  textAlign: "center",
                })}
              />
              <Text size="small" class="label">
                ms
              </Text>
            </TextFieldContainer>
          </Row>
        </Column>
      </Show>
    </Column>
  );
}

const SliderContainer = styled("div", {
  base: {
    flex: 1,
    minWidth: 0,
  },
});

const TextFieldContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-xs)",
  },
});
