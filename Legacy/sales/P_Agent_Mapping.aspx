<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="P_Agent_Mapping.aspx.vb" Inherits="Default2" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="2">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="AGENT MAPPING"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 580px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Agent Mapping From "></asp:Label>
                                    </td>
                                    <td style="width: 154px">
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                <telerik:RadComboBoxItem runat="server" Text="Agent Code" Value="A" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="USER_ID">
                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                        <HeaderStyle Width="20px" />
                                    </RowIndicatorColumn>
                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                        <HeaderStyle Width="20px" />
                                    </ExpandCollapseColumn>
                                    <Columns>
                                        <telerik:GridButtonColumn CommandName="Select" 
                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                            UniqueName="Select">
                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                            <ItemStyle Width="50px" />
                                        </telerik:GridButtonColumn>
                                        
                                        <telerik:GridBoundColumn DataField="USER_ID" 
                                            FilterControlAltText="Filter USER_ID column" HeaderText="USER_ID" 
                                            SortExpression="USER_ID" UniqueName="USER_ID">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                        </telerik:GridBoundColumn>
                                      
                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                        </telerik:GridBoundColumn>
                                          <telerik:GridBoundColumn DataField="MAP_CODE" 
                                            FilterControlAltText="Filter MAP_CODE column" HeaderText="Map_Code" 
                                            SortExpression="MAP_CODE" UniqueName="MAP_CODE">
                                        </telerik:GridBoundColumn>
                                     
                                    </Columns>
                                    <EditFormSettings>
                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                        </EditColumn>
                                    </EditFormSettings>
                                </MasterTableView>
                                <FilterMenu EnableImageSprites="False">
                                </FilterMenu>
                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                </HeaderContextMenu>
                            </telerik:RadGrid>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel36" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                            Width="1120px">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td style="width: 580px">
                                                        <asp:Label ID="Label198" runat="server" style="font-weight: 700" 
                                                            Text="Agent Mapping To"></asp:Label>
                                                    </td>
                                                    <td style="width: 154px">
                                                        <telerik:RadComboBox ID="cbosearch0" Runat="server" style="margin-left: 0px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" Selected="True" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Agent Code" Value="A" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td>
                                                        <telerik:RadTextBox ID="txtsearch0" Runat="server" Width="250px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td>
                                                        <telerik:RadButton ID="SEARCH0" runat="server" Text="Search">
                                                        </telerik:RadButton>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1120px">
                                            <telerik:RadGrid ID="GDSEARCH_2" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="USER_ID">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="USER_ID" 
                                                            FilterControlAltText="Filter USER_ID column" HeaderText="USER_ID" 
                                                            SortExpression="USER_ID" UniqueName="USER_ID">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="AGENT_NAME" 
                                                            FilterControlAltText="Filter AGENT_NAME column" HeaderText="Name" 
                                                            SortExpression="AGENT_NAME" UniqueName="AGENT_NAME">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Agent_Type" 
                                                            FilterControlAltText="Filter Agent_Type column" HeaderText="Agent_Type" 
                                                            ItemStyle-Wrap="False" SortExpression="Agent_Type" UniqueName="Agent_Type">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="AGENT_STATUS" 
                                                            FilterControlAltText="Filter AGENT_STATUS column" HeaderText="Status" 
                                                            SortExpression="AGENT_STATUS" UniqueName="AGENT_STATUS">
                                                        </telerik:GridBoundColumn>
                                                          <telerik:GridBoundColumn DataField="MAP_CODE" 
                                            FilterControlAltText="Filter MAP_CODE column" HeaderText="Map_Code" 
                                            SortExpression="MAP_CODE" UniqueName="MAP_CODE">
                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Label ID="lblRef" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label197" runat="server" Text="Map From"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 476px">
                                        <asp:Label ID="lblFrom" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 115px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label196" runat="server" Text="Map To"></asp:Label>
                                    </td>
                                    <td class="style8" style="width: 476px">
                                        <asp:Label ID="lblTo" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 115px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        <asp:Label ID="Label121" runat="server" style="font-weight: 700" 
                                            Text="Comments"></asp:Label>
                                    </td>
                                    <td rowspan="2" style="width: 476px">
                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="70px" Rows="1" 
                                            Skin="Sunset" TextMode="MultiLine" Width="450px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8" style="width: 476px; height: 16px;">
                                        <telerik:RadButton ID="btnsubmit" runat="server" Skin="Simple" Text="Update">
                                        </telerik:RadButton>
                                        <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 115px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel38" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1120px">
                                            <telerik:RadGrid ID="GDSEARCH_3" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Ref_No">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                     
                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                            SortExpression="Ref_No" UniqueName="Ref_No">
                                                        </telerik:GridBoundColumn>
                                                      
                                                        <telerik:GridBoundColumn DataField="FROM_ID" 
                                                            FilterControlAltText="Filter FROM_ID column" HeaderText="FROM_ID" 
                                                            ItemStyle-Wrap="False" SortExpression="FROM_ID" UniqueName="FROM_ID">
                                                        </telerik:GridBoundColumn>
                                                          <telerik:GridBoundColumn DataField="FROM_NAME" 
                                                            FilterControlAltText="Filter FROM_NAME column" HeaderText="FROM_NAME" 
                                                            SortExpression="FROM_NAME" UniqueName="FROM_NAME">
                                                        </telerik:GridBoundColumn>
                                                         <telerik:GridBoundColumn DataField="TO_ID" 
                                                            FilterControlAltText="Filter TO_ID column" HeaderText="TO_ID" 
                                                            ItemStyle-Wrap="False" SortExpression="TO_ID" UniqueName="TO_ID">
                                                        </telerik:GridBoundColumn>
                                                             <telerik:GridBoundColumn DataField="TO_NAME" 
                                                            FilterControlAltText="Filter TO_NAME column" HeaderText="TO_NAME" 
                                                            SortExpression="TO_NAME" UniqueName="TO_NAME">
                                                        </telerik:GridBoundColumn>
                                                       
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        &nbsp;</td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
      
    </asp:UpdatePanel>
</asp:Content>

