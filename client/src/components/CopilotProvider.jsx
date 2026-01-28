import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

const CopilotProvider = ({ children }) => {
    return (
        <CopilotKit runtimeUrl="/api/copilotkit">
            <CopilotSidebar
                instructions={"You are a helpful assistant for the TOI Tax Form. You can help users fill out the form, explain tax rules, and extract data from documents. You have access to the form data and can update it using the provided actions."}
                labels={{
                    title: "TOI AI Assistant",
                    initial: "Hi! I'm your TOI Assistant. How can I help you with your tax return today?",
                }}
                defaultOpen={false}
                clickOutsideToClose={false}
            >
                {children}
            </CopilotSidebar>
        </CopilotKit>
    );
};

export default CopilotProvider;
