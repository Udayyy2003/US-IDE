import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiC,
  SiCplusplus,
  SiHtml5,
  SiCss,
  SiJson,
  SiMarkdown,
} from "react-icons/si";
import { FaFolder, FaFileAlt, FaJava, FaFilePdf } from "react-icons/fa";

export const getFileIcon = (fileName, isDirectory) => {
  if (isDirectory) return FaFolder;
  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    py: SiPython,
    js: SiJavascript,
    ts: SiTypescript,
    c: SiC,
    cpp: SiCplusplus,
    java: FaJava,
    html: SiHtml5,
    css: SiCss,
    json: SiJson,
    md: SiMarkdown,
    pdf: FaFilePdf,
  };
  return map[ext] || FaFileAlt;
};

export const getIconColor = (fileName, isDirectory) => {
  if (isDirectory) return "#e8c547";
  const ext = fileName.split(".").pop().toLowerCase();
  const colors = {
    py: "#3776AB",
    js: "#f7df1e",
    ts: "#3178c6",
    c: "#A8B9CC",
    cpp: "#00599C",
    java: "#f89820",
    html: "#e34c26",
    css: "#264de4",
    json: "#f1e05a",
    md: "#ffffff",
    pdf: "#ff4d6d",
  };
  return colors[ext] || "#9ca3af";
};
