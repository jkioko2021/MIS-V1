<%@ Page Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false"
    CodeFile="AdminAudit.aspx.vb" Inherits="AdminAudit" Title="Admin Audit Trail" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 760px; border-right: black 1px solid; border-top: black 1px solid;
                border-left: black 1px solid; border-bottom: black 1px solid;">
                <tbody>
                    <tr>
                        <td style="color: #153e7e" colspan="3">
                            <strong>ADMIN AUDIT TRAIL</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #806517" colspan="3">
                            SELECT A REPORT TO PRINT
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:ListBox ID="LstReports" runat="server" Width="176px" ForeColor="#153E7E" BackColor="White"
                                CssClass="tinyText" OnSelectedIndexChanged="LstReports_SelectedIndexChanged">
                                <asp:ListItem>Login</asp:ListItem>
                                <asp:ListItem>Actions</asp:ListItem>
                                <asp:ListItem>Invalid Login</asp:ListItem>
                                <asp:ListItem>Full Audit</asp:ListItem>
                            </asp:ListBox>
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ErrorMessage="Select Report"
                                ControlToValidate="LstReports" Font-Bold="True"></asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #806517" colspan="3">
                            Select Viewing Criteria
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:RadioButtonList ID="rdosearch" runat="server" Width="744px" ForeColor="#153E7E"
                                RepeatDirection="Horizontal">
                                <asp:ListItem>All Users</asp:ListItem>
                                <asp:ListItem>User Name</asp:ListItem>
                            </asp:RadioButtonList>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            &nbsp;<asp:TextBox ID="txtSearch" runat="server" Width="216px" BackColor="White"
                                CssClass="tinyText"></asp:TextBox>
                            <asp:Label ID="Label2" runat="server" Font-Bold="True" ForeColor="Red"></asp:Label>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:CheckBox ID="CheckBox1" runat="server" Text="Filter By Date"></asp:CheckBox>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #153e7e" colspan="3">
                            Date From &nbsp; &nbsp; &nbsp;
                            <asp:TextBox ID="txtDateFrom" runat="server" ForeColor="#153E7E" BackColor="White"
                                CssClass="tinyText"></asp:TextBox>
                            &nbsp; &nbsp;<img id="Img1" language="javascript" onclick="return Img1_onclick()"
                                src="images/Calendar_scheduleHS.png" />
                            &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp;&nbsp; To &nbsp;
                            <asp:TextBox ID="txtDateTo" runat="server" ForeColor="#153E7E" BackColor="White"
                                CssClass="tinyText"></asp:TextBox>
                            &nbsp;
                            <img id="Img2" language="javascript" onclick="return Img1_onclick()" src="images/Calendar_scheduleHS.png" />
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:Label ID="Label1" runat="server" Width="648px" ForeColor="Red" Font-Bold="True"></asp:Label>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <asp:Button ID="Button1" OnClick="Button1_Click1" runat="server" Width="152px" Text="Generate Report">
                            </asp:Button>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <cc1:CalendarExtender ID="CalendarExtender1" runat="server" PopupButtonID="Img1"
                                TargetControlID="txtDateFrom" Format="dd-MMM-yyyy">
                            </cc1:CalendarExtender>
                            <cc1:CalendarExtender ID="CalendarExtender2" runat="server" PopupButtonID="Img2"
                                TargetControlID="txtDateTo" Format="dd-MMM-yyyy">
                            </cc1:CalendarExtender>
                        </td>
                    </tr>
                </tbody>
            </table>
        </ContentTemplate>
    </asp:UpdatePanel>
</asp:Content>
