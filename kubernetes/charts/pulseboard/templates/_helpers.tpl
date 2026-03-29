{{/*
Expand the name of the chart.
*/}}
{{- define "pulseboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "pulseboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label (name + version).
*/}}
{{- define "pulseboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels — added to every resource.
*/}}
{{- define "pulseboard.labels" -}}
helm.sh/chart: {{ include "pulseboard.chart" . }}
{{ include "pulseboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels — used in matchLabels + Service selectors.
*/}}
{{- define "pulseboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "pulseboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "pulseboard.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "pulseboard.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Fully-qualified names for each component.
*/}}
{{- define "pulseboard.api.fullname" -}}
{{- printf "%s-api" (include "pulseboard.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "pulseboard.frontend.fullname" -}}
{{- printf "%s-frontend" (include "pulseboard.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
PostgreSQL host — our own StatefulSet service when enabled,
otherwise falls back to externalDatabase.host.
*/}}
{{- define "pulseboard.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "pulseboard.fullname" .) }}
{{- else }}
{{- required "externalDatabase.host is required when postgresql.enabled=false" .Values.externalDatabase.host }}
{{- end }}
{{- end }}
