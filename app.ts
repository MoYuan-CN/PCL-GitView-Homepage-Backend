import { Octokit } from "@octokit/core";
import { writeFileSync } from "fs";

const ghClient = new Octokit({
    auth: process.env.ghpat,
});

const meta = {
    owner: "Hex-Dragon",
    repo: "PCL2",
};

async function getLabelIssueCount(state: "open" | "closed") {
    const labelCount = {};
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const { data: issues } = await ghClient.request(
            "GET /repos/{owner}/{repo}/issues",
            {
                owner: meta.owner,
                repo: meta.repo,
                state: state,
                per_page: 100,
                page: page,
            }
        );

        if (issues.length === 0) {
            hasMore = false;
            break;
        }

        issues.forEach((issue) => {
            if (issue.labels.length > 0) {
                issue.labels.forEach((label) => {
                    // 排除特定标签
                    // @ts-ignore
                    if (["➦ 删除", "➦ 解锁", "➦ 锁定"].includes(label.name))
                        return;
                    // 更新标签计数
                    // @ts-ignore
                    labelCount[label.name] = (labelCount[label.name] || 0) + 1;
                });
            }
        });

        page++;
    }
    return labelCount;
}

async function main() {
    try {
        // 获取所有 open 和 closed issues 的标签计数
        const labelCountOpen = await getLabelIssueCount("open");
        writeFileSync(
            "./open-issue.json",
            JSON.stringify(labelCountOpen, null, 2)
        );

        const labelCountClosed = await getLabelIssueCount("closed");
        writeFileSync(
            "./closed-issue.json",
            JSON.stringify(labelCountClosed, null, 2)
        );
    } catch (error) {
        console.error("Error fetching issues:", error);
    }
}

main();
